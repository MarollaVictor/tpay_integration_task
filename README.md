# TPAY Integration Task

A comprehensive ASP.NET Core MVC application demonstrating integration with the TPAY mobile payment gateway API for subscription management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Testing with Postman](#testing-with-postman)
- [Usage Flow](#usage-flow)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

This project implements a complete TPAY mobile payment integration system that includes:
- Subscription contract verification
- Free MT (Mobile Terminated) message sending
- Subscription contract cancellation
- HMAC SHA256 signature generation for secure API communication

## Features

- ✅ TPAY JavaScript library integration with dynamic digest generation
- ✅ Subscription verification with PIN code validation
- ✅ SMS notification system for successful subscriptions
- ✅ Subscription cancellation functionality
- ✅ Secure HMAC SHA256 signature implementation
- ✅ RESTful API endpoints
- ✅ Bootstrap-based responsive UI

## Prerequisites

- .NET 9.0 SDK or higher
- Visual Studio Code or Visual Studio 2022
- Postman (for API testing)
- TPAY merchant credentials:
  - Public Key
  - Private Key
  - Catalog Name
  - Product SKU
  - Subscription Plan ID

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tpay_integration_task
   ```

2. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

3. **Build the project**
   ```bash
   dotnet build
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

5. **Access the application**
   ```
   http://localhost:5168
   ```

## Configuration

### TPAY Credentials

Update the credentials in `appsettings.json`:

```json
{
  "Tpay": {
    "PublicKey": "your_public_key",
    "PrivateKey": "your_private_key",
    "CatalogName": "YourCatalogName",
    "ProductSKU": "1",
    "SubscriptionPlanID": "your_plan_id"
  }
}
```

### Application Settings

The application runs on `http://localhost:5168` by default. Update `Properties/launchSettings.json` to change the port.

## Project Structure

```
tpay_integration_task/
├── Controllers/
│   ├── HomeController.cs          # Main MVC controller
│   └── TpayController.cs          # TPAY API integration controller
├── Models/
│   └── ErrorViewModel.cs          # Error handling model
├── Views/
│   ├── Home/
│   │   ├── Index.cshtml           # Main subscription page
│   │   └── Privacy.cshtml         # Privacy page
│   └── Shared/
│       ├── _Layout.cshtml         # Layout template
│       └── Error.cshtml           # Error page
├── wwwroot/
│   ├── css/                       # Stylesheets
│   ├── js/
│   │   └── site.js                # Frontend JavaScript
│   └── lib/                       # Third-party libraries
├── appsettings.json               # Configuration file
└── Program.cs                     # Application entry point
```

## API Endpoints

### 1. Generate Digest

Generates a secure digest for loading the TPAY JavaScript library.

**Endpoint:** `GET /api/tpay/generateDigest`

**Response:**
```json
{
  "digest": "publicKey:hmacSignature",
  "scriptUrl": "http://lookup.tpay.me/idxml.ashx/v2/js?date=2025-11-10%2015:00:00Z&lang=en&digest=...",
  "date": "2025-11-10 15:00:00Z"
}
```

---

### 2. Verify Subscription

Verifies a subscription contract with a PIN code.

**Endpoint:** `POST /api/tpay/verify-subscription`

**Request Body:**
```json
{
  "subscriptionContractId": 123456,
  "pinCode": "1234",
  "transactionId": 789012,
  "charge": true
}
```

**Response:**
```json
{
  "success": true,
  "response": "{TPAY API Response}"
}
```

---

### 3. Send Free MT Message

Sends a congratulatory SMS after successful subscription.

**Endpoint:** `POST /api/tpay/send-free-mt`

**Request Body:**
```json
{
  "messageBody": "Congratulations! Your subscription is active.",
  "operatorCode": "60201",
  "subscriptionContractId": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "response": "{TPAY API Response}"
}
```

---

### 4. Cancel Subscription

Cancels an active subscription contract.

**Endpoint:** `POST /api/tpay/cancel-subscription`

**Request Body:**
```json
{
  "subscriptionContractId": 123456
}
```

**Response:**
```json
{
  "success": true,
  "response": "{TPAY API Response}"
}
```

## Testing with Postman

### Setup Postman Collection

1. **Create a new collection** named "TPAY Integration Tests"

2. **Set Base URL Variable**
   - Variable: `base_url`
   - Value: `http://localhost:5168`

### Test 1: Generate Digest

```
GET {{base_url}}/api/tpay/generateDigest
```

**Expected Response:**
- Status: 200 OK
- Body contains: `digest`, `scriptUrl`, `date`

**Test Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has digest", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('digest');
    pm.expect(jsonData).to.have.property('scriptUrl');
    pm.expect(jsonData).to.have.property('date');
});
```

---

### Test 2: Verify Subscription

```
POST {{base_url}}/api/tpay/verify-subscription
Content-Type: application/json

{
  "subscriptionContractId": 123456,
  "pinCode": "1234",
  "transactionId": 789012,
  "charge": true
}
```

**Expected Response:**
- Status: 200 OK
- Body contains: `success`, `response`

**Test Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Subscription verification response", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('response');
});
```

---

### Test 3: Send Free MT Message

```
POST {{base_url}}/api/tpay/send-free-mt
Content-Type: application/json

{
  "messageBody": "Welcome to our service!",
  "operatorCode": "60201",
  "subscriptionContractId": "123456"
}
```

**Expected Response:**
- Status: 200 OK
- Body contains: `success`, `response`

**Test Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("SMS sent successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

---

### Test 4: Cancel Subscription

```
POST {{base_url}}/api/tpay/cancel-subscription
Content-Type: application/json

{
  "subscriptionContractId": 123456
}
```

**Expected Response:**
- Status: 200 OK
- Body contains: `success`, `response`

**Test Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Subscription cancelled", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

---

### Postman Collection Import

You can import this JSON to quickly set up all tests:

```json
{
  "info": {
    "name": "TPAY Integration Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5168"
    }
  ],
  "item": [
    {
      "name": "Generate Digest",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/tpay/generateDigest"
      }
    },
    {
      "name": "Verify Subscription",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/tpay/verify-subscription",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"subscriptionContractId\": 123456,\n  \"pinCode\": \"1234\",\n  \"transactionId\": 789012,\n  \"charge\": true\n}"
        }
      }
    },
    {
      "name": "Send Free MT",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/tpay/send-free-mt",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"messageBody\": \"Welcome!\",\n  \"operatorCode\": \"60201\",\n  \"subscriptionContractId\": \"123456\"\n}"
        }
      }
    },
    {
      "name": "Cancel Subscription",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/tpay/cancel-subscription",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"subscriptionContractId\": 123456\n}"
        }
      }
    }
  ]
}
```

## Usage Flow

### User Subscription Flow

1. **User visits the homepage**
   - Enters mobile number
   - Selects mobile operator (Orange/Vodafone)

2. **Click "Subscribe" button**
   - Frontend calls `/api/tpay/generateDigest`
   - Loads TPAY JavaScript library with generated digest
   - TPAY popup appears for PIN entry

3. **User enters PIN code**
   - Frontend calls `/api/tpay/verify-subscription`
   - System verifies the subscription contract

4. **Send confirmation SMS**
   - System calls `/api/tpay/send-free-mt`
   - User receives congratulatory SMS

5. **Subscription active**
   - User can now cancel via `/api/tpay/cancel-subscription`

## Security

### HMAC Signature Generation

All TPAY API requests are signed using HMAC SHA256:

```csharp
Format: publicKey:HexString(HMACSHA256(privateKey, message))
```

**Message formats:**

- **Generate Digest:** `date + lang`
- **Verify Subscription:** `subscriptionContractId + pinCode [+ transactionId + charge]`
- **Send Free MT:** `messageBody + operatorCode + subscriptionContractId`
- **Cancel Subscription:** `subscriptionContractId`

### Important Security Notes

⚠️ **Never expose private keys in client-side code**
⚠️ **Always use HTTPS in production**
⚠️ **Validate all input data before processing**
⚠️ **Use environment variables for sensitive configuration**

## Troubleshooting

### Common Issues

**Issue:** "Signature verification failed"
- **Solution:** Ensure the message format matches exactly (no extra spaces)
- **Solution:** Verify the private key is correct
- **Solution:** Check that the timestamp is in UTC format

**Issue:** "CORS error when calling TPAY API"
- **Solution:** CORS is configured in `Program.cs`, ensure it's enabled

**Issue:** "Port already in use"
- **Solution:** Change port in `Properties/launchSettings.json`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for demonstration purposes.

## Contact

For questions or support, please contact the development team.

---

**Note:** This is a demonstration project. Always refer to the official TPAY API documentation for the most up-to-date integration guidelines.
