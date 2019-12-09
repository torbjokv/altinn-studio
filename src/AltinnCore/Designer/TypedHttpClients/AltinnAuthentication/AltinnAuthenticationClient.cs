using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AltinnCore.Common.Configuration;
using Microsoft.Extensions.Options;

namespace AltinnCore.Designer.TypedHttpClients.AltinnAuthentication
{
    /// <summary>
    /// AltinnAuthenticationClient
    /// </summary>
    public class AltinnAuthenticationClient : IAltinnAuthenticationClient
    {
        private readonly HttpClient _httpClient;
        private readonly PlatformSettings _platformSettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="httpClient">HttpClient</param>
        public AltinnAuthenticationClient(
            HttpClient httpClient,
            IOptionsMonitor<PlatformSettings> options)
        {
            _httpClient = httpClient;
            _platformSettings = options.CurrentValue;
        }

        /// <inheritdoc/>
        public async Task<string> ConvertTokenAsync(string token, Uri uri)
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            /*
             * Have to create a HttpRequestMessage instead of using helper extension methods like _httpClient.PostAsync(...)
             * because the endpoint is built up in that way
             */
            HttpRequestMessage message = new HttpRequestMessage
            {
                RequestUri = new Uri($"{uri.Scheme}://{uri.Host}/{_platformSettings.ApiAuthenticationConvertUri}")
            };
            HttpResponseMessage response = await _httpClient.SendAsync(message);
            return await response.Content.ReadAsAsync<string>();
        }
    }
}