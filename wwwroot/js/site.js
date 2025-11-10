// =========================================
// TPAY Integration Demo - site.js
// =========================================

// Configuration from TPAY
const TPAY_CONFIG = {
    publicKey: 'qTmCPw7W5W2S57gL0kwM',
    privateKey: 'cv6kWabwxYRUSPSia1nj',
    catalogName: 'IntegrationTask',
    productSKU: '1',
    subscriptionPlanID: 2425,
    merchantTemplateKey: 'integrationTask'
};

let tpayScriptLoaded = false;

// 1. Load the TPAY JS library dynamically with proper digest
async function loadTPAYScript() {
    try {
        console.log('Loading TPAY Script...');
        
        // Get digest from our backend API
        const digestResponse = await fetch('/api/tpay/generateDigest');
        if (!digestResponse.ok) {
            throw new Error('Failed to get digest: ' + digestResponse.statusText);
        }
        
        const digestData = await digestResponse.json();
        console.log('Digest received:', digestData);
        
        // Create script tag with proper TPAY library URL
        const script = document.createElement('script');
        script.src = digestData.scriptUrl;
        script.type = 'text/javascript';
        
        script.onload = function() {
            console.log('TPAY script loaded successfully');
            tpayScriptLoaded = true;
            console.log('TPay object available:', typeof window.TPay);
            if (window.TPay && window.TPay.HeaderEnrichment) {
                console.log('TPay.HeaderEnrichment is available');
            }
        };
        
        script.onerror = function() {
            console.error('Failed to load TPAY script from:', digestData.scriptUrl);
            showMessage('Failed to load payment library. Please refresh the page.', 'danger');
        };
        
        document.head.appendChild(script);
    } catch (error) {
        console.error('Error loading TPAY script:', error);
        showMessage('Error loading payment library: ' + error.message, 'danger');
    }
}

// 2. Initialize checkout with operator
function initCheckout(msisdn, operatorCode) {
    try {
        console.log('Initializing checkout with msisdn:', msisdn, 'operator:', operatorCode);
        
        if (!window.TPay || !window.TPay.HeaderEnrichment) {
            console.error('TPay.HeaderEnrichment not available');
            showMessage('Payment library not ready. Please refresh and try again.', 'danger');
            return;
        }
        
        // Check if enriched (user is on mobile network)
        if (!window.TPay.HeaderEnrichment.enriched()) {
            window.TPay.HeaderEnrichment.init({ operatorCode: operatorCode });
            console.log('HeaderEnrichment.init() called with operator:', operatorCode);
        } else {
            const detectedOperator = window.TPay.HeaderEnrichment.operatorCode();
            console.log('Enriched - Operator auto-detected:', detectedOperator);
        }
    } catch (error) {
        console.error('Error in initCheckout:', error);
        showMessage('Error initializing payment: ' + error.message, 'danger');
    }
}

// 3. Confirm subscription and get checkout URL
function confirmCheckout(msisdn, operatorCode) {
    try {
        console.log('Confirming checkout...');
        
        if (!window.TPay || !window.TPay.HeaderEnrichment || !window.TPay.HeaderEnrichment.confirm) {
            console.error('TPay.HeaderEnrichment.confirm not available');
            showMessage('Payment library not ready. Please refresh and try again.', 'danger');
            return;
        }
        
        const subscriptionInfo = {
            subscriptionPlanId: TPAY_CONFIG.subscriptionPlanID,
            productCatalog: TPAY_CONFIG.catalogName,
            productSku: TPAY_CONFIG.productSKU,
            operatorCode: operatorCode,
            msisdn: msisdn,
            customerAccountNumber: 'customer_' + Date.now(),
            merchantTemplateKey: TPAY_CONFIG.merchantTemplateKey
        };
        
        console.log('Subscription info:', subscriptionInfo);
        
        // Call TPAY confirm function
        window.TPay.HeaderEnrichment.confirm(subscriptionInfo, function(status, refCode, contractDetails) {
            console.log('Confirm callback received:');
            console.log('  Status:', status);
            console.log('  RefCode:', refCode);
            console.log('  ContractDetails:', contractDetails);
            
            handleConfirmResponse(status, refCode, contractDetails, operatorCode, msisdn);
        });
    } catch (error) {
        console.error('Error in confirmCheckout:', error);
        showMessage('Error: ' + error.message, 'danger');
        document.getElementById('loading').classList.add('d-none');
    }
}

// 4. Handle confirm callback response
function handleConfirmResponse(status, refCode, contractDetails, operatorCode, msisdn) {
    const messageBox = document.getElementById('message');
    const loading = document.getElementById('loading');
    
    if (loading) {
        loading.classList.add('d-none');
    }
    
    // Case 1: Subscription confirmed immediately (refCode present)
    if (status === true && refCode) {
        console.log('✓ Subscription confirmed successfully');
        showMessage('✓ Subscription successful! Redirecting...', 'success');
        
        // Send congratulation SMS
        if (contractDetails && contractDetails.subscriptionContractId) {
            sendFreeMTMessage(contractDetails.subscriptionContractId, operatorCode);
        }
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
            window.location.href = '/Home/PaymentSuccess';
        }, 2000);
    }
    // Case 2: Subscription pending verification (PIN required)
    else if (status === true && !refCode && contractDetails) {
        console.log('⏳ Subscription pending - PIN verification required');
        showMessage('PIN code has been sent to your phone. Please check your SMS.', 'info');
        
        // Prompt for PIN
        const pinCode = prompt('Enter the PIN code you received on your phone:');
        if (pinCode && contractDetails.subscriptionContractId) {
            verifySubscriptionWithPIN(
                contractDetails.subscriptionContractId,
                pinCode,
                contractDetails.transactionId || null,
                operatorCode
            );
        } else {
            showMessage('PIN verification cancelled.', 'warning');
        }
    }
    // Case 3: Subscription failed
    else {
        console.error('✗ Subscription failed');
        showMessage('✗ Subscription failed. Please try again.', 'danger');
    }
}

// 5. Verify subscription with PIN code
async function verifySubscriptionWithPIN(subscriptionContractId, pinCode, transactionId, operatorCode) {
    try {
        console.log('Verifying PIN for contract:', subscriptionContractId);
        
        const response = await fetch('/api/tpay/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscriptionContractId: subscriptionContractId,
                pinCode: pinCode,
                transactionId: transactionId,
                charge: true
            })
        });
        
        const data = await response.json();
        console.log('PIN verification response:', data);
        
        if (data.success) {
            showMessage('✓ PIN verified! Subscription confirmed.', 'success');
            
            // Send congratulation SMS
            sendFreeMTMessage(subscriptionContractId, operatorCode);
            
            // Redirect to success page
            setTimeout(() => {
                window.location.href = '/Home/PaymentSuccess';
            }, 2000);
        } else {
            showMessage('✗ Invalid PIN. Please try again.', 'danger');
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        showMessage('Error verifying PIN: ' + error.message, 'danger');
    }
}

// 6. Send Free MT congratulation message
async function sendFreeMTMessage(subscriptionContractId, operatorCode) {
    try {
        console.log('Sending congratulation SMS...');
        
        const response = await fetch('/api/tpay/send-free-mt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageBody: 'Congratulations! You have successfully subscribed to our service. To cancel, reply UNSUB IIT',
                operatorCode: operatorCode,
                subscriptionContractId: subscriptionContractId.toString()
            })
        });
        
        const data = await response.json();
        console.log('Free MT response:', data);
        
        if (data.success) {
            console.log('✓ Congratulation message sent');
        } else {
            console.error('Failed to send message:', data.error);
        }
    } catch (error) {
        console.error('Error sending Free MT:', error);
    }
}

// 7. Handle subscribe button click
document.addEventListener('DOMContentLoaded', function() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function() {
            const msisdn = document.getElementById('msisdn').value.trim();
            const operator = document.getElementById('operator').value.trim();
            const loading = document.getElementById('loading');
            
            // Validate inputs
            if (!msisdn) {
                showMessage('Please enter your mobile number', 'danger');
                return;
            }
            
            if (!operator) {
                showMessage('Please select an operator', 'danger');
                return;
            }
            
            // Check if TPAY script is loaded
            if (!tpayScriptLoaded) {
                showMessage('Payment library is loading. Please wait...', 'warning');
                return;
            }
            
            // Show loading
            if (loading) {
                loading.classList.remove('d-none');
            }
            
            // Initialize and confirm
            setTimeout(() => {
                initCheckout(msisdn, operator);
                setTimeout(() => {
                    confirmCheckout(msisdn, operator);
                }, 500);
            }, 300);
        });
    }
});

// 8. Helper function to show messages
function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.className = `fw-bold text-${type}`;
    }
    console.log('Message:', msg, 'Type:', type);
}

// 9. Load TPAY script on page load
window.addEventListener('load', function() {
    console.log('Page loaded - loading TPAY script');
    loadTPAYScript();
});
