/**
 * Shopify OAuth Authentication Module
 * Handles the OAuth flow for Shopify app installation
 */

const crypto = require('crypto');
const axios = require('axios');
const { config } = require('./config');

/**
 * Generate Shopify OAuth authorization URL
 * @param {string} shop - Shopify store domain (e.g., 'mystore.myshopify.com')
 * @param {string} redirectUri - Redirect URI after authorization
 * @returns {string} Authorization URL
 */
function generateAuthUrl(shop, redirectUri) {
  const { apiKey, scopes } = config.shopify;
  const state = crypto.randomBytes(16).toString('hex');
  
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state: state,
    'grant_options[]': ''
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Verify Shopify OAuth callback
 * @param {Object} query - Request query parameters
 * @returns {boolean} True if verification passes
 */
function verifyOAuthCallback(query) {
  const { apiSecret } = config.shopify;
  
  // Shopify sends these parameters
  const { hmac, code, shop, state, timestamp } = query;
  
  // Remove hmac from parameters
  const params = { ...query };
  delete params.hmac;
  delete params.signature; // Some versions use signature
  
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Generate HMAC
  const generatedHash = crypto
    .createHmac('sha256', apiSecret)
    .update(sortedParams)
    .digest('hex');
  
  return generatedHash === hmac;
}

/**
 * Exchange authorization code for access token
 * @param {string} shop - Shopify store domain
 * @param {string} code - Authorization code
 * @returns {Promise<Object>} Access token response
 */
async function exchangeCodeForToken(shop, code) {
  const { apiKey, apiSecret } = config.shopify;
  
  const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
    client_id: apiKey,
    client_secret: apiSecret,
    code: code
  });
  
  return response.data;
}

/**
 * Get shop information using access token
 * @param {string} shop - Shopify store domain
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Shop information
 */
async function getShopInfo(shop, accessToken) {
  const response = await axios.get(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.shop;
}

/**
 * Register webhooks for a shop
 * @param {string} shop - Shopify store domain
 * @param {string} accessToken - Access token
 * @param {string} appUrl - App base URL
 * @returns {Promise<Array>} Webhook registration results
 */
async function registerWebhooks(shop, accessToken, appUrl) {
  const webhooks = [
    {
      topic: 'products/create',
      address: `${appUrl}/webhook/products/create`,
      format: 'json'
    },
    {
      topic: 'products/update',
      address: `${appUrl}/webhook/products/update`,
      format: 'json'
    },
    {
      topic: 'products/delete',
      address: `${appUrl}/webhook/products/delete`,
      format: 'json'
    },
    {
      topic: 'app/uninstalled',
      address: `${appUrl}/webhook/app/uninstalled`,
      format: 'json'
    }
  ];

  const results = await Promise.all(
    webhooks.map(async (webhook) => {
      try {
        const response = await axios.post(
          `https://${shop}/admin/api/2024-01/webhooks.json`,
          { webhook },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true, data: response.data };
      } catch (error) {
        console.error(`Failed to register webhook ${webhook.topic}:`, error.message);
        return { success: false, error: error.message };
      }
    })
  );

  return results;
}

/**
 * Create script tags for the storefront
 * @param {string} shop - Shopify store domain
 * @param {string} accessToken - Access token
 * @param {string} appUrl - App base URL
 * @returns {Promise<Array>} Script tag creation results
 */
async function createScriptTags(shop, accessToken, appUrl) {
  const scriptTags = [
    {
      event: 'onload',
      src: `${appUrl}/public/js/shopify-frontend.js`,
      display_scope: 'online_store'
    }
  ];

  const results = await Promise.all(
    scriptTags.map(async (scriptTag) => {
      try {
        const response = await axios.post(
          `https://${shop}/admin/api/2024-01/script_tags.json`,
          { script_tag: scriptTag },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Failed to create script tag:', error.message);
        return { success: false, error: error.message };
      }
    })
  );

  return results;
}

/**
 * Validate shop domain
 * @param {string} shop - Shopify store domain
 * @returns {boolean} True if valid
 */
function validateShopDomain(shop) {
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Generate nonce for CSRF protection
 * @returns {string} Random nonce
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify nonce for CSRF protection
 * @param {string} nonce - Nonce to verify
 * @param {string} storedNonce - Stored nonce
 * @returns {boolean} True if valid
 */
function verifyNonce(nonce, storedNonce) {
  return nonce === storedNonce;
}

module.exports = {
  generateAuthUrl,
  verifyOAuthCallback,
  exchangeCodeForToken,
  getShopInfo,
  registerWebhooks,
  createScriptTags,
  validateShopDomain,
  generateNonce,
  verifyNonce
};