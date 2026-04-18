/**
 * Configuration file for Forcekeys Shopify App
 */

const config = {
  // Shopify App Configuration
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_content,write_content',
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    appUrl: process.env.SHOPIFY_APP_URL || 'http://localhost:3000',
    
    // OAuth configuration
    auth: {
      callbackPath: '/auth/callback',
      installPath: '/auth',
      afterInstallPath: '/dashboard'
    }
  },

  // Forcekeys API Configuration
  forcekeys: {
    apiKey: process.env.FORCEKEYS_API_KEY || '',
    apiUrl: process.env.FORCEKEYS_API_URL || 'https://api.translate.forcekeys.com',
    apiVersion: 'v1',
    
    // Endpoints
    endpoints: {
      translate: '/api/v1/wordpress/translate',
      batchTranslate: '/api/v1/wordpress/batch-translate',
      shopifyRegister: '/api/v1/shopify/register',
      shopifyUnregister: '/api/v1/shopify/unregister',
      usageStats: '/api/v1/usage/stats'
    }
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-this'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/forcekeys_shopify',
    type: process.env.DB_TYPE || 'postgres', // 'postgres' or 'mysql'
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  },

  // Redis Configuration (optional, for caching)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true' || false
  },

  // Translation Configuration
  translation: {
    defaultSourceLang: process.env.DEFAULT_SOURCE_LANG || 'auto',
    defaultTargetLang: process.env.DEFAULT_TARGET_LANG || 'en',
    cacheEnabled: process.env.TRANSLATION_CACHE_ENABLED !== 'false',
    cacheDuration: parseInt(process.env.TRANSLATION_CACHE_DURATION) || 86400, // 24 hours in seconds
    
    // Auto-translation settings
    autoTranslateProducts: process.env.AUTO_TRANSLATE_PRODUCTS === 'true' || false,
    autoTranslateCollections: process.env.AUTO_TRANSLATE_COLLECTIONS === 'true' || false,
    autoTranslatePages: process.env.AUTO_TRANSLATE_PAGES === 'true' || false,
    
    // Fields to translate
    translateFields: {
      product: {
        title: true,
        description: true,
        metafields: false,
        tags: false,
        seo: true
      },
      collection: {
        title: true,
        description: true,
        metafields: false,
        seo: true
      },
      page: {
        title: true,
        body: true,
        seo: true
      }
    }
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || 'app.log'
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    helmet: {
      enabled: true
    },
    csrf: {
      enabled: process.env.NODE_ENV === 'production'
    }
  },

  // Feature Flags
  features: {
    webhooks: process.env.FEATURE_WEBHOOKS !== 'false',
    batchTranslation: process.env.FEATURE_BATCH_TRANSLATION !== 'false',
    realtimeTranslation: process.env.FEATURE_REALTIME_TRANSLATION !== 'false',
    analytics: process.env.FEATURE_ANALYTICS !== 'false',
    multiLanguageSEO: process.env.FEATURE_MULTI_LANGUAGE_SEO !== 'false'
  },

  // Supported Languages
  languages: [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
  ],

  // App Metadata
  app: {
    name: 'Forcekeys Translation API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'Translate your Shopify store with AI-powered translation',
    author: 'Forcekeys',
    supportEmail: 'support@forcekeys.com',
    website: 'https://forcekeys.com'
  }
};

// Validate required configuration
function validateConfig() {
  const errors = [];

  // Check Shopify configuration
  if (!config.shopify.apiKey) {
    errors.push('SHOPIFY_API_KEY is required');
  }
  if (!config.shopify.apiSecret) {
    errors.push('SHOPIFY_API_SECRET is required');
  }

  // Check Forcekeys configuration
  if (!config.forcekeys.apiKey) {
    errors.push('FORCEKEYS_API_KEY is required');
  }

  // Check database configuration in production
  if (config.server.nodeEnv === 'production' && !config.database.url) {
    errors.push('DATABASE_URL is required in production');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your environment variables.');
    process.exit(1);
  }
}

// Export configuration
module.exports = {
  config,
  validateConfig
};