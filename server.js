const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PAYHERO CONFIG
const BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH || 'Basic ZFJ1TVhWQzQ4dWpXa2Y1TGZCWFo6RmhjaDIxRWc4WExrUVhhM29wRGhiSVBzUzZRbkkyRVRLSUxqZk5xdw==';
const CALLBACK_URL = process.env.CALLBACK_URL || '';
const CHANNEL_ID =  process.env.PAYHERO_CHANNEL_ID || '5920';

// ROUTE 1: TUMA STK
app.post('/pay', async (req, res) => {
  try {
    const { phone, amount, limit, name } = req.body;
    const externalRef = crypto.randomBytes(16).toString("hex");

    console.log(`STK Request: ${name} - ${phone} - Ksh ${amount} for limit ${limit}`);  
    
    // TUMA STK KWA PAYHERO
    const payheroAuth = BASIC_AUTH //&& BASIC_AUTH.startsWith('Basic') ? BASIC_AUTH : `Basic ${BASIC_AUTH}`;
    const payheroRes = await axios.post(  
      'https://backend.payhero.co.ke/api/v2/payments',  
      {  
        amount: parseInt(amount),  
        phone_number: phone,  
        channel_id: parseInt(CHANNEL_ID), // <-- MUST BE INTEGER
        provider: "m-pesa", // <-- lowercase is standard 
        external_reference: externalRef,  
        callback_url: CALLBACK_URL  
      },  
      {  
        headers: {  
          'Authorization': payheroAuth,  
          'Content-Type': 'application/json'  
        }  
      }  
    );  
    
    res.json({   
      success: true,   
      message: 'STK Sent to your phone',  
      checkout_id: payheroRes.data.checkout_request_id,
      external_ref: externalRef
    });

  } catch (error) {
    // LOG MORE CONTEXT - HTTP status + response body
    console.error('PAYHERO ERROR:', {
      status: error.response ? error.response.status : undefined,
      data: error.response ? error.response.data : undefined,
      message: error.message
    });
    
    res.status(500).json({
      success: false,
      message: (error.response && error.response.data && error.response.data.message) ? error.response.data.message : 'Payment failed',
      error: error.response ? error.response.data : undefined
    });
  }
});

// ROUTE 2: CALLBACK YA PAYHERO - VERIFY + HANDLE STATUS
app.post('/callback', (req, res) => {
  // TODO: Verify signature from Payhero in production
  // const signature = req.headers['x-payhero-signature'];
  
  console.log("Payment Callback Received:", req.body);
  
  // EXTRACT TRANSACTION STATUS
  const { status, external_reference, amount, phone_number, mpesa_receipt_number } = req.body;
  
  if(status === 'SUCCESS'){
    console.log(`Payment SUCCESS: Ref ${external_reference} - ${phone_number} - Ksh ${amount} - MPESA: ${mpesa_receipt_number}`);
    // Hapa unaeza mark payment as successful kwa records zako
  } else if(status === 'FAILED' || status === 'CANCELLED'){
    console.log(`Payment FAILED: Ref ${external_reference} - Status: ${status}`);
    // Hapa unaeza mark payment as failed
  } else {
    console.log(`Payment PENDING: Ref ${external_reference} - Status: ${status}`);
  }
  
  res.status(200).send('OK');
});

// Reject GET and other methods on /callback
app.all('/callback', (req, res) => {
  res.status(405).json({
    success: false,
    message: "Method Not Allowed. This endpoint only accepts POST requests."
  });
});

// TEST ROUTE
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('UNEXPECTED ERROR:', err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
