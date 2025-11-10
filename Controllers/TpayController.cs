using System.Text;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;

namespace tpay_integration_task.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TpayController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        // TPAY Configuration
        private const string PUBLIC_KEY = "qTmCPw7W5W2S57gL0kwM";
        private const string PRIVATE_KEY = "cv6kWabwxYRUSPSia1nj";
        private const string CATALOG_NAME = "IntegrationTask";
        private const string PRODUCT_SKU = "1";
        private const int SUBSCRIPTION_PLAN_ID = 2425;

        // TPAY API Endpoints
        private const string VERIFY_SUBSCRIPTION_URL = "http://live.tpay.me/api/TPAYSubscription.svc/Json/VerifySubscriptionContract";
        private const string SEND_FREE_MT_URL = "http://live.tpay.me/api/TPAY.svc/json/SendFreeMTMessage";
        private const string CANCEL_SUBSCRIPTION_URL = "http://live.tpay.me/api/TPAYSubscription.svc/Json/CancelSubscriptionContractRequest";
        private const string DIGEST_SCRIPT_URL = "http://lookup.tpay.me/idxml.ashx/v2/js";

        public TpayController(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        /// <summary>
        /// Section 4.2: Load TPAY JS Library - Generate digest for security
        /// </summary>
        [HttpGet("generateDigest")]
        public IActionResult GenerateDigest()
        {
            try
            {
                // Format: YYYY-MM-DD HH:mm:ssZ (UTC) - IMPORTANT: Must be current time, not hardcoded
                string date = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ssZ");
                string message = date + "en"; // date + lang

                // Generate HMAC SHA256 signature
                string signature = GenerateSignature(message);

                // Build the TPAY script URL with the generated digest
                string scriptUrl = $"{DIGEST_SCRIPT_URL}?date={Uri.EscapeDataString(date)}&lang=en&digest={Uri.EscapeDataString(signature)}";

                return Ok(new { digest = signature, scriptUrl = scriptUrl, date = date });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Section 5.1: Verify Subscription Contract
        /// Called after user enters PIN code
        /// </summary>
        [HttpPost("verify-subscription")]
        public async Task<IActionResult> VerifySubscription([FromBody] VerifySubscriptionRequest request)
        {
            try
            {
                // Build message for signature
                string message = request.SubscriptionContractId.ToString() + request.PinCode;
                
                if (request.TransactionId.HasValue && request.Charge.HasValue)
                {
                    message += request.TransactionId.ToString() + request.Charge.ToString();
                }

                string signature = GenerateSignature(message);

                var payload = new
                {
                    signature = signature,
                    subscriptionContractId = request.SubscriptionContractId,
                    pinCode = request.PinCode,
                    transactionId = request.TransactionId,
                    charge = request.Charge
                };

                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(VERIFY_SUBSCRIPTION_URL, content);
                var result = await response.Content.ReadAsStringAsync();

                return Ok(new { success = response.IsSuccessStatusCode, response = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Section 5.2: Send Free MT Message
        /// Send congratulation SMS after successful subscription
        /// </summary>
        [HttpPost("send-free-mt")]
        public async Task<IActionResult> SendFreeMT([FromBody] SendFreeMTRequest request)
        {
            try
            {
                // Signature message = messageBody + operatorCode + subscriptionContractId
                string message = request.MessageBody + request.OperatorCode + request.SubscriptionContractId;
                string signature = GenerateSignature(message);

                var payload = new
                {
                    signature = signature,
                    messageBody = request.MessageBody,
                    operatorCode = request.OperatorCode,
                    subscriptionContractId = request.SubscriptionContractId
                };

                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(SEND_FREE_MT_URL, content);
                var result = await response.Content.ReadAsStringAsync();

                return Ok(new { success = response.IsSuccessStatusCode, response = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Section 5.3: Cancel Subscription Contract
        /// </summary>
        [HttpPost("cancel-subscription")]
        public async Task<IActionResult> CancelSubscription([FromBody] CancelSubscriptionRequest request)
        {
            try
            {
                string message = request.SubscriptionContractId.ToString();
                string signature = GenerateSignature(message);

                var payload = new
                {
                    signature = signature,
                    subscriptionContractId = request.SubscriptionContractId
                };

                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(CANCEL_SUBSCRIPTION_URL, content);
                var result = await response.Content.ReadAsStringAsync();

                return Ok(new { success = response.IsSuccessStatusCode, response = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Generate HMAC SHA256 Signature
        /// Format: merchantPublicKey + ":" + HexString(HMACSHA256(merchantPrivateKey, message))
        /// </summary>
        private string GenerateSignature(string message)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(PRIVATE_KEY)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
                string hexHash = BitConverter.ToString(hash).Replace("-", "").ToLower();
                return $"{PUBLIC_KEY}:{hexHash}";
            }
        }
    }

    // Request Models
    public class VerifySubscriptionRequest
    {
        public int SubscriptionContractId { get; set; }
        public required string PinCode { get; set; }
        public int? TransactionId { get; set; }
        public bool? Charge { get; set; }
    }

    public class SendFreeMTRequest
    {
        public required string MessageBody { get; set; }
        public required string OperatorCode { get; set; }
        public required string SubscriptionContractId { get; set; }
    }

    public class CancelSubscriptionRequest
    {
        public int SubscriptionContractId { get; set; }
    }
}