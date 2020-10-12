using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Altinn.Platform.Events.Configuration;
using Altinn.Platform.Events.Models;
using Altinn.Platform.Events.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Altinn.Platform.Events.Controllers
{
    /// <summary>
    /// Provides operations for handling events
    /// </summary>
    [Route("events/api/v1/app")]
    [ApiController]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly IEventsRepository _repository;
        private readonly ILogger _logger;
        private readonly string _eventsBaseUri;

        /// <summary>
        /// Initializes a new instance of the <see cref="EventsController"/> class
        /// </summary>
        /// <param name="repository">the events repository handler</param>
        /// <param name="settings">the general settings</param>
        /// <param name="logger">dependency injection of logger</param>
        public EventsController(IEventsRepository repository, IOptions<GeneralSettings> settings, ILogger<EventsController> logger)
        {
            _repository = repository;
            _logger = logger;
            _eventsBaseUri = $"https://platform.{settings.Value.Hostname}";
        }

        /// <summary>
        /// Inserts a new event.
        /// </summary>
        /// <param name="cloudEvent">The event to store.</param>
        /// <returns>The application metadata object.</returns>
        [HttpPost]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [Produces("application/json")]
        [Authorize(Policy = "PlatformAccess")]
        public async Task<ActionResult<string>> Post([FromBody] CloudEvent cloudEvent)
        {
            if (string.IsNullOrEmpty(cloudEvent.Source.OriginalString) || string.IsNullOrEmpty(cloudEvent.SpecVersion) ||
            string.IsNullOrEmpty(cloudEvent.Type) || string.IsNullOrEmpty(cloudEvent.Subject))
            {
                return BadRequest("Missing parameter values: source, subject, type, id or time cannot be null");
            }

            try
            {
                string cloudEventId = await _repository.Create(cloudEvent);

                _logger.LogInformation("Cloud Event successfully stored with id: {0}", cloudEventId);

                return Created(cloudEvent.Subject, cloudEventId);
            }
            catch (Exception e)
            {
                _logger.LogError($"Unable to store cloud event in database. {e}");
                return StatusCode(500, $"Unable to store cloud event in database. {e}");
            }
        }

        /// <summary>
        /// Retrieves a set of events based on query parameters.
        /// </summary>
        [HttpGet("{org}/{app}")]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [Produces("application/json")]
        public async Task<ActionResult<List<CloudEvent>>> Get(
            [FromQuery] string after,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int party,
            [FromQuery] List<string> source,
            [FromQuery] List<string> type,
            [FromQuery] int size = 50)
        {
            if (string.IsNullOrEmpty(after) && from == null)
            {
                return BadRequest("From or after must be defined.");
            }

            if (size < 1)
            {
                return BadRequest("Size must be a number larger that 0.");
            }

            try
            {
                List<CloudEvent> events = await _repository.Get(after, from, to, party, source, type, size);

                if (events.Count > 0)
                {
                    string nextUri = $"{_eventsBaseUri}{Request.Path}?after={events.Last().Id}";

                    List<KeyValuePair<string, string>> queryCollection = Request.Query
                        .SelectMany(q => q.Value, (col, value) => new KeyValuePair<string, string>(col.Key, value))
                        .Where(q => q.Key != "after")
                        .ToList();

                    foreach (KeyValuePair<string, string> queryParam in queryCollection)
                    {
                        nextUri += $"&{queryParam.Key}={queryParam.Value}";
                    }

                    Response.Headers.Add("next", nextUri);
                }

                return events;
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Unable to get cloud events from database. {e}");
            }
        }
    }
}
