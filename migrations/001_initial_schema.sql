-- Forcekeys Shopify App - Initial Database Schema
-- PostgreSQL compatible (also works with MySQL with minor adjustments)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores Shopify store installations
CREATE TABLE shopify_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  shop_name VARCHAR(255),
  shop_email VARCHAR(255),
  shop_country VARCHAR(2),
  shop_currency VARCHAR(3),
  shop_timezone VARCHAR(50),
  
  -- Shopify OAuth tokens
  access_token TEXT NOT NULL,
  scope TEXT,
  
  -- Forcekeys API configuration
  forcekeys_api_key TEXT,
  forcekeys_account_id VARCHAR(100),
  
  -- App settings
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{
    "auto_translate_products": false,
    "auto_translate_collections": false,
    "auto_translate_pages": false,
    "translate_titles": true,
    "translate_descriptions": true,
    "translate_metafields": false,
    "cache_enabled": true
  }',
  
  -- Language settings
  default_source_language VARCHAR(10) DEFAULT 'auto',
  default_target_language VARCHAR(10) DEFAULT 'en',
  enabled_languages JSONB DEFAULT '["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi"]',
  
  -- Status and timestamps
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  uninstalled_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_shopify_installations_shop_domain (shop_domain),
  INDEX idx_shopify_installations_is_active (is_active),
  INDEX idx_shopify_installations_installed_at (installed_at)
);

-- Stores translation history
CREATE TABLE translation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL,
  
  -- Content information
  content_type VARCHAR(50) NOT NULL, -- 'product', 'collection', 'page', 'blog'
  content_id VARCHAR(100) NOT NULL, -- Shopify ID
  content_title VARCHAR(500),
  
  -- Translation details
  source_language VARCHAR(10),
  target_language VARCHAR(10) NOT NULL,
  original_text TEXT,
  translated_text TEXT,
  
  -- Character and cost tracking
  character_count INTEGER,
  api_cost DECIMAL(10,4),
  api_provider VARCHAR(50) DEFAULT 'forcekeys',
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_translation_history_shop_domain (shop_domain),
  INDEX idx_translation_history_content_type (content_type),
  INDEX idx_translation_history_content_id (content_id),
  INDEX idx_translation_history_created_at (created_at),
  INDEX idx_translation_history_status (status),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Stores product translation cache
CREATE TABLE product_translation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  
  -- Language information
  source_language VARCHAR(10),
  target_language VARCHAR(10) NOT NULL,
  
  -- Translated fields
  title_translation TEXT,
  description_translation TEXT,
  metafields_translation JSONB DEFAULT '{}',
  
  -- SEO translations
  seo_title_translation TEXT,
  seo_description_translation TEXT,
  
  -- Cache metadata
  cache_key VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  hit_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE (shop_domain, product_id, target_language),
  INDEX idx_product_translation_cache_shop_domain (shop_domain),
  INDEX idx_product_translation_cache_product_id (product_id),
  INDEX idx_product_translation_cache_expires_at (expires_at),
  INDEX idx_product_translation_cache_cache_key (cache_key),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Stores usage statistics
CREATE TABLE usage_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL,
  
  -- Period
  period_date DATE NOT NULL, -- Daily statistics
  period_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  
  -- Translation metrics
  total_translations INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  total_api_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Content type breakdown
  product_translations INTEGER DEFAULT 0,
  collection_translations INTEGER DEFAULT 0,
  page_translations INTEGER DEFAULT 0,
  blog_translations INTEGER DEFAULT 0,
  
  -- Language breakdown
  language_breakdown JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE (shop_domain, period_date),
  INDEX idx_usage_statistics_shop_domain (shop_domain),
  INDEX idx_usage_statistics_period_date (period_date),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Stores webhook events
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL,
  
  -- Webhook information
  topic VARCHAR(100) NOT NULL, -- 'products/create', 'products/update', etc.
  webhook_id VARCHAR(100),
  
  -- Event data
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  
  -- Delivery information
  delivery_attempts INTEGER DEFAULT 0,
  last_delivery_attempt TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_webhook_events_shop_domain (shop_domain),
  INDEX idx_webhook_events_topic (topic),
  INDEX idx_webhook_events_processed (processed),
  INDEX idx_webhook_events_received_at (received_at),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Stores app settings (global and per-store)
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255),
  
  -- Setting information
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'array', 'object'
  is_global BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE (shop_domain, setting_key) WHERE shop_domain IS NOT NULL,
  UNIQUE (setting_key) WHERE is_global = true AND shop_domain IS NULL,
  INDEX idx_app_settings_shop_domain (shop_domain),
  INDEX idx_app_settings_setting_key (setting_key),
  INDEX idx_app_settings_is_global (is_global),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Stores API rate limits
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL,
  
  -- Rate limit information
  endpoint VARCHAR(255) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Usage tracking
  request_count INTEGER DEFAULT 0,
  limit_count INTEGER DEFAULT 100, -- Default limit
  exceeded BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE (shop_domain, endpoint, period_start),
  INDEX idx_api_rate_limits_shop_domain (shop_domain),
  INDEX idx_api_rate_limits_endpoint (endpoint),
  INDEX idx_api_rate_limits_period_start (period_start),
  FOREIGN KEY (shop_domain) REFERENCES shopify_installations(shop_domain) ON DELETE CASCADE
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_shopify_installations_updated_at 
  BEFORE UPDATE ON shopify_installations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_history_updated_at 
  BEFORE UPDATE ON translation_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_translation_cache_updated_at 
  BEFORE UPDATE ON product_translation_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_statistics_updated_at 
  BEFORE UPDATE ON usage_statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_events_updated_at 
  BEFORE UPDATE ON webhook_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_rate_limits_updated_at 
  BEFORE UPDATE ON api_rate_limits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default global settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, is_global, description, category)
VALUES 
  ('default_cache_duration', '86400', 'number', true, 'Default cache duration in seconds (24 hours)', 'cache'),
  ('max_retry_attempts', '3', 'number', true, 'Maximum number of retry attempts for failed operations', 'retry'),
  ('retry_delay_ms', '5000', 'number', true, 'Delay between retry attempts in milliseconds', 'retry'),
  ('enable_analytics', 'true', 'boolean', true, 'Enable usage analytics collection', 'analytics'),
  ('enable_error_logging', 'true', 'boolean', true, 'Enable error logging', 'logging'),
  ('supported_languages', '["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi"]', 'array', true, 'List of supported languages', 'translation'),
  ('default_translation_provider', 'forcekeys', 'string', true, 'Default translation provider', 'translation'),
  ('max_batch_size', '50', 'number', true, 'Maximum batch size for batch translations', 'translation'),
  ('webhook_timeout_ms', '30000', 'number', true, 'Webhook processing timeout in milliseconds', 'webhooks'),
  ('rate_limit_window_ms', '900000', 'number', true, 'Rate limit window in milliseconds (15 minutes)', 'rate_limiting')
ON CONFLICT (setting_key) WHERE is_global = true AND shop_domain IS NULL DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_translation_history_shop_domain_content_type 
  ON translation_history(shop_domain, content_type);

CREATE INDEX idx_product_translation_cache_shop_domain_target_language 
  ON product_translation_cache(shop_domain, target_language);

CREATE INDEX idx_usage_statistics_shop_domain_period_date_period_type 
  ON usage_statistics(shop_domain, period_date, period_type);

CREATE INDEX idx_webhook_events_shop_domain_processed_received_at 
  ON webhook_events(shop_domain, processed, received_at);

-- Comments for documentation
COMMENT ON TABLE shopify_installations IS 'Stores Shopify store installations and their configuration';
COMMENT ON TABLE translation_history IS 'Stores history of all translations performed';
COMMENT ON TABLE product_translation_cache IS 'Caches product translations for better performance';
COMMENT ON TABLE usage_statistics IS 'Stores usage statistics for billing and analytics';
COMMENT ON TABLE webhook_events IS 'Stores webhook events from Shopify';
COMMENT ON TABLE app_settings IS 'Stores application settings (global and per-store)';
COMMENT ON TABLE api_rate_limits IS 'Tracks API rate limits per store and endpoint';