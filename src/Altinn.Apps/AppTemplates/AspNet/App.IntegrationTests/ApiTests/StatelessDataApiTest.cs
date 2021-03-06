using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

using Altinn.App.IntegrationTests;

using App.IntegrationTests.Utils;
using App.IntegrationTestsRef.Utils;

using Newtonsoft.Json;

using Xunit;

namespace App.IntegrationTests.ApiTests
{
    public class StatelessDataApiTest : IClassFixture<CustomWebApplicationFactory<Altinn.App.Startup>>
    {
        private readonly CustomWebApplicationFactory<Altinn.App.Startup> _factory;

        public StatelessDataApiTest(CustomWebApplicationFactory<Altinn.App.Startup> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task StatelessData_Post_ObjectSucessfullyPrefilledAndCalculated()
        {
            // Arrange
            string org = "ttd";
            string app = "presentationfields-app";
            string expectedPrefillValue = "Sophie Salt";
            string expectedCalculatedValue = "calculatedValue";
            string token = PrincipalUtil.GetToken(1337);

            HttpClient client = SetupUtil.GetTestClient(_factory, org, app);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            string requestUri = $"/{org}/{app}/v1/data?dataType=default";

            HttpRequestMessage httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, requestUri);

            // Act
            HttpResponseMessage res = await client.SendAsync(httpRequestMessage);

            string responseContent = await res.Content.ReadAsStringAsync();
            Mocks.Apps.Ttd.PresentationTextsApp.Skjema dataObject = JsonConvert.DeserializeObject<Mocks.Apps.Ttd.PresentationTextsApp.Skjema>(responseContent);
            string actualPrefillValue = dataObject?.OpplysningerOmArbeidstakerengrp8819?.Arbeidsforholdgrp8856?.AnsattSammenhengendeAnsattAnsettelsedatadef33267?.value;
            string actualCalculatedValue = dataObject?.OpplysningerOmArbeidstakerengrp8819?.Skjemainstansgrp8854?.IdentifikasjonsnummerKravdatadef33317?.value;

            // Assert
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            Assert.NotNull(actualPrefillValue);
            Assert.NotNull(actualCalculatedValue);
            Assert.Equal(expectedPrefillValue, actualPrefillValue);
            Assert.Equal(expectedCalculatedValue, actualCalculatedValue);
        }

        [Fact]
        public async Task StatelessData_Put_CalculationsRunAndDataReturned()
        {
            // Arrange
            string org = "ttd";
            string app = "model-validation";
            decimal expected = 1001;

            string token = PrincipalUtil.GetToken(1337);

            HttpClient client = SetupUtil.GetTestClient(_factory, org, app);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            string requestUri = $"/{org}/{app}/v1/data?dataType=default";
            string requestBody = "{\"skjemanummer\":\"1472\",\"spesifikasjonsnummer\":\"9812\",\"blankettnummer\":\"AFP-01\",\"tittel\":\"ArbeidsgiverskjemaAFP\",\"gruppeid\":\"8818\",\"OpplysningerOmArbeidstakerengrp8819\":{\"Arbeidsforholdgrp8856\":{\"AnsattSammenhengendeAnsattAnsettelsedatadef33267\":{\"value\":\"SophieSalt\",\"orid\":\"33267\"},},\"Skjemainstansgrp8854\":{\"Journalnummerdatadef33316\":{\"value\":\"1000\"}}}}";

            HttpRequestMessage httpRequestMessage = new HttpRequestMessage(HttpMethod.Put, requestUri)
            {
                Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
            };

            // Act
            HttpResponseMessage res = await client.SendAsync(httpRequestMessage);

            string responseContent = await res.Content.ReadAsStringAsync();
            Mocks.Apps.ttd.model_validation.Skjema dataObject = JsonConvert.DeserializeObject<Mocks.Apps.ttd.model_validation.Skjema>(responseContent);
            decimal? actual = dataObject?.OpplysningerOmArbeidstakerengrp8819?.Skjemainstansgrp8854?.Journalnummerdatadef33316?.value;

            // Assert
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            Assert.NotNull(actual);
            Assert.Equal(expected, actual);
        }
    }
}
