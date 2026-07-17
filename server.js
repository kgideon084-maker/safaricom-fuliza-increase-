const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PAYHERO CONFIG
const BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH;
const CALLBACK_URL = process.env.CALLBACK_URL;
const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID; // <-- 

// ROUTE 1: TUMA STK
app.post('/pay', async (req, res) => {
  try {
    const { phone, amount, limit, name } = req.body;
    const externalRef = crypto.randomUUID();

    console.log(`STK Request: ${name} - ${phone} - Ksh ${amount} for limit ${limit}`);  
    
    // TUMA STK KWA PAYHERO
    const payheroRes = await axios.post(  
      'https://api.payhero.co.ke/api/v2/payments',  
      {  
        amount: amount,  
        phone_number: phone,  
        channel_id: CHANNEL_ID, // <-- 
        provider: "MPESA",  
        external_reference: externalRef,  
        callback_url: CALLBACK_URL  
      },  
      {  
        headers: {  
          'Authorization': BASIC_AUTH,  
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
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Payment failed',
      error: error.response?.data
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

// TEST ROUTE
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Fuliza STK Server is Running' });
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
