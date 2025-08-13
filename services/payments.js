const axios = require('axios');

class PaymentService {
  constructor() {
    this.mpesaConfig = {
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
      sandboxUrl: 'https://sandbox.safaricom.co.ke',
      liveUrl: 'https://api.safaricom.co.ke'
    };

    this.stripeConfig = {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    };

    this.flutterwaveConfig = {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY
    };
  }

  // M-Pesa STK Push (existing implementation)
  async initiateMpesaPayment(phoneNumber, amount, orderId, description) {
    try {
      const token = await this.getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.mpesaConfig.businessShortCode}${this.mpesaConfig.passkey}${timestamp}`
      ).toString('base64');

      const requestData = {
        BusinessShortCode: this.mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.mpesaConfig.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.mpesaConfig.callbackUrl,
        AccountReference: `CHOPRICE-${orderId}`,
        TransactionDesc: description || `Payment for Order #${orderId}`
      };

      const response = await axios.post(
        `${this.mpesaConfig.sandboxUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        checkoutRequestId: response.data.CheckoutRequestID
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Stripe Payment Intent (for card payments)
  async initiateStripePayment(amount, currency, orderId, customerEmail) {
    try {
      const stripe = require('stripe')(this.stripeConfig.secretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency || 'kes',
        metadata: {
          orderId: orderId.toString(),
          service: 'choprice'
        },
        receipt_email: customerEmail,
        description: `Choprice Order #${orderId}`
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Flutterwave Payment (for multiple African payment methods)
  async initiateFlutterwavePayment(amount, currency, orderId, customerData) {
    try {
      const Flutterwave = require('flutterwave-node-v3');
      const flw = new Flutterwave(this.flutterwaveConfig.publicKey, this.flutterwaveConfig.secretKey);

      const payload = {
        tx_ref: `CHOPRICE-${orderId}-${Date.now()}`,
        amount: amount,
        currency: currency || 'KES',
        redirect_url: `${process.env.CLIENT_URL}/payment/callback`,
        customer: {
          email: customerData.email,
          phonenumber: customerData.phone,
          name: customerData.name
        },
        customizations: {
          title: 'Choprice Payment',
          description: `Payment for Order #${orderId}`,
          logo: `${process.env.CLIENT_URL}/logo192.png`
        },
        meta: {
          orderId: orderId,
          service: 'choprice'
        }
      };

      const response = await flw.Charge.card(payload);

      return {
        success: true,
        data: response,
        paymentLink: response.data?.link,
        reference: payload.tx_ref
      };
    } catch (error) {
      console.error('Flutterwave payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Bank Transfer Payment (Manual)
  async initiateBankTransfer(amount, orderId, customerData) {
    try {
      // Generate unique reference for bank transfer
      const reference = `CHOPRICE-BANK-${orderId}-${Date.now()}`;
      
      const bankDetails = {
        bankName: 'Equity Bank Kenya',
        accountName: 'Choprice Limited',
        accountNumber: '1234567890',
        branch: 'Westlands Branch',
        swiftCode: 'EQBLKENA',
        reference: reference,
        amount: amount,
        currency: 'KES'
      };

      // Store pending bank transfer in database
      // This would be handled by the calling function

      return {
        success: true,
        paymentMethod: 'bank_transfer',
        reference: reference,
        bankDetails: bankDetails,
        instructions: [
          '1. Transfer the exact amount to the bank account details provided',
          '2. Use the reference number in your transaction description',
          '3. Send proof of payment via WhatsApp to +254700000000',
          '4. Your order will be confirmed once payment is verified'
        ]
      };
    } catch (error) {
      console.error('Bank transfer setup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // PayPal Payment (for international customers)
  async initiatePayPalPayment(amount, currency, orderId, customerData) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      // Configure PayPal environment
      const environment = process.env.NODE_ENV === 'production' 
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          );

      const client = new paypal.core.PayPalHttpClient(environment);

      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `CHOPRICE-${orderId}`,
          amount: {
            currency_code: currency || 'USD',
            value: amount.toString()
          },
          description: `Choprice Order #${orderId}`
        }],
        application_context: {
          return_url: `${process.env.CLIENT_URL}/payment/success`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
          brand_name: 'Choprice',
          landing_page: 'BILLING'
        }
      });

      const response = await client.execute(request);

      return {
        success: true,
        orderId: response.result.id,
        approvalUrl: response.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment status across all methods
  async verifyPayment(paymentMethod, transactionId, orderId) {
    try {
      switch (paymentMethod) {
        case 'mpesa':
          return await this.verifyMpesaPayment(transactionId);
        
        case 'stripe':
          return await this.verifyStripePayment(transactionId);
        
        case 'flutterwave':
          return await this.verifyFlutterwavePayment(transactionId);
        
        case 'paypal':
          return await this.verifyPayPalPayment(transactionId);
        
        case 'bank_transfer':
          return await this.verifyBankTransfer(transactionId, orderId);
        
        default:
          return {
            success: false,
            error: 'Unsupported payment method'
          };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to get M-Pesa token
  async getMpesaToken() {
    const auth = Buffer.from(
      `${this.mpesaConfig.consumerKey}:${this.mpesaConfig.consumerSecret}`
    ).toString('base64');

    const response = await axios.get(
      `${this.mpesaConfig.sandboxUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  }

  // Verify M-Pesa payment
  async verifyMpesaPayment(checkoutRequestId) {
    try {
      const token = await this.getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.mpesaConfig.businessShortCode}${this.mpesaConfig.passkey}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        `${this.mpesaConfig.sandboxUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.mpesaConfig.businessShortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.ResultCode === '0',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify Stripe payment
  async verifyStripePayment(paymentIntentId) {
    try {
      const stripe = require('stripe')(this.stripeConfig.secretKey);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: paymentIntent.status === 'succeeded',
        data: paymentIntent
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify Flutterwave payment
  async verifyFlutterwavePayment(transactionId) {
    try {
      const Flutterwave = require('flutterwave-node-v3');
      const flw = new Flutterwave(this.flutterwaveConfig.publicKey, this.flutterwaveConfig.secretKey);

      const response = await flw.Transaction.verify({ id: transactionId });

      return {
        success: response.data.status === 'successful',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify PayPal payment
  async verifyPayPalPayment(orderId) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = process.env.NODE_ENV === 'production' 
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          );

      const client = new paypal.core.PayPalHttpClient(environment);
      const request = new paypal.orders.OrdersGetRequest(orderId);
      
      const response = await client.execute(request);

      return {
        success: response.result.status === 'COMPLETED',
        data: response.result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify bank transfer (manual verification)
  async verifyBankTransfer(reference, orderId) {
    // This would typically involve manual verification or integration with bank APIs
    // For now, return pending status
    return {
      success: false,
      pending: true,
      message: 'Bank transfer verification pending. Please contact support with proof of payment.'
    };
  }

  // Get available payment methods for a customer
  getAvailablePaymentMethods(customerCountry = 'KE', orderAmount = 0) {
    const methods = [];

    // M-Pesa (Kenya only)
    if (customerCountry === 'KE') {
      methods.push({
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Pay with M-Pesa STK Push',
        icon: '/images/mpesa-logo.png',
        minAmount: 10,
        maxAmount: 150000,
        currencies: ['KES'],
        processingTime: 'Instant',
        fees: 'No additional fees'
      });
    }

    // Stripe (Card payments)
    methods.push({
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or American Express',
      icon: '/images/card-logo.png',
      minAmount: 100,
      maxAmount: 1000000,
      currencies: ['KES', 'USD', 'EUR'],
      processingTime: 'Instant',
      fees: '3.4% + KES 20'
    });

    // Flutterwave (African payment methods)
    if (['KE', 'NG', 'GH', 'UG', 'TZ'].includes(customerCountry)) {
      methods.push({
        id: 'flutterwave',
        name: 'Mobile Money & Cards',
        description: 'Pay with mobile money or local cards',
        icon: '/images/flutterwave-logo.png',
        minAmount: 50,
        maxAmount: 500000,
        currencies: ['KES', 'NGN', 'GHS', 'UGX', 'TZS'],
        processingTime: 'Instant',
        fees: '2.9% + local fees'
      });
    }

    // Bank Transfer
    methods.push({
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer (manual verification)',
      icon: '/images/bank-logo.png',
      minAmount: 500,
      maxAmount: 10000000,
      currencies: ['KES'],
      processingTime: '1-3 business days',
      fees: 'Bank charges apply'
    });

    // PayPal (International)
    methods.push({
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: '/images/paypal-logo.png',
      minAmount: 100,
      maxAmount: 1000000,
      currencies: ['USD', 'EUR', 'GBP'],
      processingTime: 'Instant',
      fees: '4.4% + fixed fee'
    });

    // Filter by order amount
    return methods.filter(method => 
      orderAmount >= method.minAmount && orderAmount <= method.maxAmount
    );
  }
}

module.exports = new PaymentService();