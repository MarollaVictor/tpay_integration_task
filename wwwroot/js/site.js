// =========================================
// TPAY Integration Demo
// =========================================

// 1. Load the TPAY JS library dynamically
function loadTPAYScript() {
    const script = document.createElement("script");
    script.src = "http://lookup.tpay.me/idxml.ashx/v2/js?date=2025-11-08&lang=en&digest=testDigest";
    document.head.appendChild(script);
}
loadTPAYScript();

// 2. Function to handle subscription
document.getElementById("subscribeBtn").addEventListener("click", async function () {
    const msisdn = document.getElementById("msisdn").value;
    const operator = document.getElementById("operator").value;
    const messageBox = document.getElementById("message");

    if (!msisdn || !operator) {
        messageBox.innerText = "Please enter a mobile number and select an operator.";
        messageBox.style.color = "red";
        return;
    }

    messageBox.innerText = "Initializing subscription...";
    messageBox.style.color = "blue";

    try {
        // 3. Call TPAY Init (as per the integration doc)
        const initResponse = {
            publicKey: "qTmCPw7W5W2S57gL0kwM",
            privateKey: "cv6kWabwxYRUSPSia1nj",
            productCatalog: "IntegrationTask",
            sku: "1",
            subscriptionPlanId: "2425",
            msisdn: msisdn,
            operatorCode: operator
        };

        console.log("Init data:", initResponse);

        // Simulate TPAY JS Init()
        if (typeof TPay !== "undefined" && TPay.Init) {
            TPay.Init(initResponse);
        }

        // 4. Call TPAY Confirm()
        if (typeof TPay !== "undefined" && TPay.Confirm) {
            TPay.Confirm((response) => {
                console.log("TPAY Confirm Response:", response);
                if (response.status && response.refCode) {
                    messageBox.innerText = "Redirecting to TPAY checkout...";
                    // Redirect to checkout URL if available
                    if (response.checkoutUrl) {
                        window.location.href = response.checkoutUrl;
                    }
                } else if (response.status && !response.refCode) {
                    messageBox.innerText = "Contract pending verification. Waiting for PIN...";
                } else {
                    messageBox.innerText = "Subscription failed. Try again.";
                    messageBox.style.color = "red";
                }
            });
        } else {
            // Fallback since we can't access real TPAY library
            console.log("Simulated Confirm: Subscription successful!");
            messageBox.innerText = "Simulated TPAY Checkout: Subscription successful!";
            messageBox.style.color = "green";
        }
    } catch (error) {
        console.error(error);
        messageBox.innerText = "Error during subscription.";
        messageBox.style.color = "red";
    }
});
