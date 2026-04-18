/**
 * Forcekeys Translation API - Shopify App
 * Main server file for the Shopify application
 * 
 * This app connects to Shopify stores via webhooks and provides
 * translation functionality for product titles, descriptions, and metafields.
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy for Shopify
app.set('trust proxy', 1);

// Verify Shopify webhook signature
function verifyWebhookSignature(body, hmacHeader, secret) {
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hmacHeader === generatedHash;
}

// Translation API call to Forcekeys backend
async function translateText(text, sourceLang, targetLang, apiKey) {
  try {
    const response = await axios.post(
      `${process.env.FORCEKEYS_API_URL}/api/v1/wordpress/translate`,
      {
        text,
        source: sourceLang,
        target: targetLang
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Translation error:', error.message);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Shopify
app.post('/webhook/products/create', async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    // Verify webhook signature in production
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmacHeader) {
      const body = JSON.stringify(req.body);
      if (!verifyWebhookSignature(body, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const product = req.body;
    console.log(`Received product create webhook from ${shopDomain}:`, product.id);
    
    // Process the product (translate if enabled)
    // This would typically check if auto-translation is enabled for this store
    
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/products/update', async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmacHeader) {
      const body = JSON.stringify(req.body);
      if (!verifyWebhookSignature(body, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const product = req.body;
    console.log(`Received product update webhook from ${shopDomain}:`, product.id);
    
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/products/delete', async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmacHeader) {
      const body = JSON.stringify(req.body);
      if (!verifyWebhookSignature(body, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    console.log(`Received product delete webhook from ${shopDomain}`);
    
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoints for translation (called from Shopify admin interface)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, apiKey } = req.body;
    
    if (!text || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await translateText(
      text,
      sourceLang || 'auto',
      targetLang || 'en',
      apiKey
    );
    
    res.json(result);
  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// Batch translation endpoint
app.post('/api/translate/batch', async (req, res) => {
  try {
    const { items, sourceLang, targetLang, apiKey } = req.body;
    
    if (!items || !Array.isArray(items) || !apiKey) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const result = await translateText(
            item.text,
            sourceLang || 'auto',
            targetLang || 'en',
            apiKey
          );
          return {
            id: item.id,
            success: true,
            translatedText: result.translated_text
          };
        } catch (error) {
          return {
            id: item.id,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({ results });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({ error: 'Batch translation failed' });
  }
});

// Translate product endpoint
app.post('/api/product/translate', async (req, res) => {
  try {
    const { productId, targetLang, apiKey, translateTitle, translateDescription, translateMetafields } = req.body;
    
    if (!productId || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get store credentials
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    // This would typically:
    // 1. Fetch the product from Shopify using the Storefront API or Admin API
    // 2. Translate the specified fields
    // 3. Update the product with translated content
    
    res.json({
      status: 'success',
      productId,
      message: 'Product translation initiated'
    });
  } catch (error) {
    console.error('Product translation error:', error);
    res.status(500).json({ error: 'Product translation failed' });
  }
});

// Register store endpoint (called during app installation)
app.post('/api/store/register', async (req, res) => {
  try {
    const { shopDomain, accessToken, apiKey } = req.body;
    
    if (!shopDomain || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Register the store with Forcekeys backend
    const response = await axios.post(
      `${process.env.FORCEKEYS_API_URL}/api/v1/shopify/register`,
      {
        shop_domain: shopDomain,
        access_token: accessToken,
        api_key: apiKey,
        app_version: '1.0.0'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Store registration error:', error);
    res.status(500).json({ error: 'Store registration failed' });
  }
});

// Uninstall webhook - called when app is uninstalled
app.post('/webhook/app/uninstalled', async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmacHeader) {
      const body = JSON.stringify(req.body);
      if (!verifyWebhookSignature(body, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const shopDomain = req.body.id || req.headers['x-shopify-shop-domain'];
    console.log(`App uninstalled from ${shopDomain}`);
    
    // Notify Forcekeys backend to deactivate this store
    try {
      await axios.post(
        `${process.env.FORCEKEYS_API_URL}/api/v1/shopify/unregister`,
        { shop_domain: shopDomain },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      console.error('Failed to notify backend of uninstall:', e.message);
    }
    
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Uninstall webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Forcekeys Shopify App running on port ${PORT}`);
  console.log(`Forcekeys API URL: ${process.env.FORCEKEYS_API_URL || 'http://localhost:5000'}`);
});

module.exports = app;
