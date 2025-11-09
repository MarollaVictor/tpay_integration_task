using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace tpay_integration_task.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TpayController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public TpayController(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        [HttpPost("sendFreeMT")]
        public async Task<IActionResult> SendFreeMT([FromBody] FreeMtRequest request)
        {
            try
            {
                //  Your TPAY API credentials
                var publicKey = "qTmCPw7W5W2S57gL0kwM";
                var privateKey = "cv6kWabwxYRUSPSia1nj";

                //  TPAY Free MT Endpoint (staging/live depending on test)
                var url = "https://api.tpay.me/v1/sendFreeMT";

                // JSON body
                var json = $@"
                {{
                    ""publicKey"": ""{publicKey}"",
                    ""privateKey"": ""{privateKey}"",
                    ""msisdn"": ""{request.Msisdn}"",
                    ""message"": ""{request.Message}""
                }}";

                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                var result = await response.Content.ReadAsStringAsync();

                return Ok(new { success = response.IsSuccessStatusCode, response = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("generateDigest")]
        public IActionResult GenerateDigest()
        {
            try
            {
                string privateKey = "cv6kWabwxYRUSPSia1nj";
                string date = DateTime.UtcNow.ToString("20251112THH:mm:ssZ");

                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(privateKey + date));
                    string digest = BitConverter.ToString(hash).Replace("-", "").ToLower();

                    string scriptUrl = $"http://lookup.tpay.me/idxml.ashx/v2/js?date={date}&lang=en&digest={digest}";

                    return Ok(new { digest = digest, scriptUrl } );
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    // Simple model for request body
    public class FreeMtRequest
    {
        public required string Msisdn { get; set; }
        public required string Message { get; set; }
    }
}
