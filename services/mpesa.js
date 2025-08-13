const axios = require('axios');

class MPesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    // M-Pesa API URLs
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    
    this.authUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    this.stkPushUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
  }

  // Generate access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(this.authUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Generate timestamp for M-Pesa
  generateTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Generate password for M-Pesa
  generatePassword(timestamp) {
    const data = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  // Format phone number for M-Pesa
  formatPhoneNumber(phone) {
    // Remove any spaces, dashes, or plus signs
    let cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    // If starts with 0, replace with 254
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!cleanPhone.startsWith('254')) {
      cleanPhone = '254' + cleanPhone;
    }
    
    return cleanPhone;
  }

  // Initiate STK Push
  async initiateSTKPush(phone, amount, orderId, accountReference = 'Choprice Order') {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      const formattedPhone = this.formatPhoneNumber(phone);

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // Ensure amount is integer
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: `Payment for Choprice Order #${orderId}`
      };

      console.log('STK Push Request:', {
        ...requestData,
        Password: '[HIDDEN]'
      });

      const response = await axios.post(this.stkPushUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('STK Push Response:', response.data);

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          merchantRequestId: response.data.MerchantRequestID,
          checkoutRequestId: response.data.CheckoutRequestID,
          responseCode: response.data.ResponseCode,
          responseDescription: response.data.ResponseDescription,
          customerMessage: response.data.CustomerMessage
        };
      } else {
        throw new Error(response.data.ResponseDescription || 'STK Push failed');
      }

    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.ResponseDescription || error.message || 'Payment initiation failed'
      };
    }
  }

  // Process M-Pesa callback
  processCallback(callbackData) {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;
      
      const result = {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDescription: stkCallback.ResultDesc
      };

      // If payment was successful
      if (stkCallback.ResultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        
        const getMetadataValue = (name) => {
          const item = callbackMetadata.find(item => item.Name === name);
          return item ? item.Value : null;
        };

        result.success = true;
        result.amount = getMetadataValue('Amount');
        result.mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
        result.transactionDate = getMetadataValue('TransactionDate');
        result.phoneNumber = getMetadataValue('PhoneNumber');
      } else {
        result.success = false;
        result.error = stkCallback.ResultDesc;
      }

      return result;
    } catch (error) {
      console.error('Callback processing error:', error);
      return {
        success: false,
        error: 'Failed to process payment callback'
      };
    }
  }

  // Query transaction status
  async queryTransaction(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const queryUrl = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;
      
      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(queryUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Transaction query error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.ResponseDescription || error.message
      };
    }
  }
}

module.exports = new MPesaService();