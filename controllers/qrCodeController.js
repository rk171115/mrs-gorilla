// controllers/qrCodeController.js
const axios = require('axios');

const createQRCode = async (req, res) => {
  try {
    // Hardcode the credentials for test
    const keyId = 'rzp_test_HOznD0kcU57Llw';
    const keySecret = 'ZjEJR47tBc7PVBiC4rVMPyl';  // Make sure this matches exactly

    // Simplify the request payload
    const requestData = {
      type: 'upi_qr',
      name: 'My Store',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: 500,
      description: 'Payment for Product X'
      // Removed customer_id and other potentially problematic fields
    };

    console.log('Sending minimal request to Razorpay');

    // Make request to Razorpay API with explicit authentication
    const response = await axios({
      method: 'post',
      url: 'https://api.razorpay.com/v1/payments/qr_codes',
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: keyId,
        password: keySecret
      },
      data: requestData
    });

    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error creating QR code:', error.response?.data || error.message);
    console.log('Full error:', error);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || 'Failed to create QR code'
    });
  }
};

module.exports = {
  createQRCode
};