# Forcekeys Translation API - Shopify App

![Shopify App Version](https://img.shields.io/badge/version-1.0.0-blue)
![Shopify](https://img.shields.io/badge/Shopify-%E2%9C%93-green)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-339933)
![Express](https://img.shields.io/badge/Express-4.x-000000)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Translate your Shopify store products, collections, and content using the powerful Forcekeys Translation API. This Shopify app provides seamless translation integration for e-commerce stores with support for 70+ languages.

## ✨ Features

### 🛍️ Product Translation
- **Automatic product translation** for new products
- **Bulk translation** of entire product catalogs
- **Real-time translation** in Shopify admin
- **Multi-language SEO optimization**
- **Product variant translation** support

### 📦 Collection & Content Translation
- **Collection descriptions** translation
- **Page content** translation
- **Blog post** translation
- **Metafield translation** for custom fields
- **URL handle optimization** for multilingual SEO

### 🔧 Admin Features
- **Easy installation** from Shopify App Store
- **Intuitive dashboard** for translation management
- **Usage statistics** and quota monitoring
- **Translation history** with detailed logs
- **Customizable language settings**

### 🔌 Integration Features
- **Shopify webhooks** for real-time updates
- **Shopify Admin API** integration
- **Shopify GraphQL** support
- **Shopify Polaris** design system
- **Shopify OAuth 2.0** authentication

## 📋 Requirements

### Shopify Requirements
- Shopify store with admin access
- Shopify Partner account (for development)
- Shopify App Store listing (for production)

### Server Requirements
- Node.js 18.x or higher
- npm 8.x or higher
- PostgreSQL 12+ or MySQL 8+ (for production)
- Redis (optional, for caching)
- SSL certificate (for production)

### API Requirements
- Forcekeys Translation API account
- Valid API key with sufficient quota
- Internet connectivity to `api.translate.forcekeys.com`

## 🚀 Installation

### Method 1: Shopify App Store (Recommended for Store Owners)
1. Visit the [Shopify App Store](https://apps.shopify.com/forcekeys-translation)
2. Click **Add app**
3. Follow the installation wizard
4. Grant necessary permissions
5. Configure your API key

### Method 2: Development Installation (For Developers)
```bash
# Clone the repository
git clone https://github.com/forcekeys/shopify-translation-app.git
cd shopify-translation-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure environment variables
# Edit .env with your Shopify and Forcekeys credentials

# Start development server
npm run dev
```

### Method 3: Docker Installation
```bash
# Build Docker image
docker build -t forcekeys-shopify-app .

# Run container
docker run -p 3000:3000 \
  -e SHOPIFY_API_KEY=your_key \
  -e SHOPIFY_API_SECRET=your_secret \
  -e FORCEKEYS_API_KEY=your_forcekeys_key \
  forcekeys-shopify-app
```

## ⚙️ Configuration

### 1. Shopify App Setup
1. Create a Shopify Partner account at [partners.shopify.com](https://partners.shopify.com)
2. Create a new app in your partner dashboard
3. Configure app settings:
   - **App URL**: `https://your-domain.com`
   - **Allowed redirection URL(s)**: `https://your-domain.com/auth/callback`
   - **Webhook subscriptions**: Enable product create/update/delete
4. Copy API key and secret to your `.env` file

### 2. Environment Variables
Create a `.env` file with the following:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_content,write_content
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_APP_URL=https://your-domain.com

# Forcekeys Configuration
FORCEKEYS_API_KEY=your_forcekeys_api_key
FORCEKEYS_API_URL=https://api.translate.forcekeys.com

# Server Configuration
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/forcekeys_shopify
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key
```

### 3. Database Setup
```bash
# For PostgreSQL
createdb forcekeys_shopify
npm run migrate

# For MySQL
mysql -u root -p -e "CREATE DATABASE forcekeys_shopify;"
npm run migrate
```

### 4. Webhook Configuration
```bash
# Register webhooks with Shopify
npm run setup-webhooks
```

## 📖 Usage

### Installation Flow
1. **Store owner** installs app from Shopify App Store
2. **OAuth flow** redirects to your app
3. **API key configuration** screen appears
4. **Permissions granted** for required scopes
5. **Dashboard loads** with translation tools

### Translation Dashboard
Access the dashboard at `https://your-shop.myshopify.com/admin/apps/forcekeys-translation`

Features include:
- **Product translation** interface
- **Bulk translation** tools
- **Language settings** configuration
- **Usage statistics** dashboard
- **Translation history** log

### API Endpoints

#### Translation API
```javascript
// Translate single text
POST /api/translate
{
  "text": "Hello World",
  "sourceLang": "auto",
  "targetLang": "es",
  "apiKey": "your_api_key"
}

// Batch translate
POST /api/translate/batch
{
  "items": [
    { "id": "1", "text": "Hello" },
    { "id": "2", "text": "Goodbye" }
  ],
  "sourceLang": "auto",
  "targetLang": "fr",
  "apiKey": "your_api_key"
}

// Translate product
POST /api/product/translate
{
  "productId": "123456789",
  "targetLang": "de",
  "apiKey": "your_api_key",
  "translateTitle": true,
  "translateDescription": true,
  "translateMetafields": false
}
```

#### Webhook Endpoints
```javascript
// Product created
POST /webhook/products/create

// Product updated
POST /webhook/products/update

// Product deleted
POST /webhook/products/delete

// App uninstalled
POST /webhook/app/uninstalled
```

### Shopify Admin Integration
The app adds:
- **Translation button** on product edit pages
- **Bulk actions** in product listings
- **Collection translation** tools
- **Content translation** for pages and blogs
- **Settings page** in Shopify admin

## 🎨 Customization

### Theme Integration
Add translation buttons to your storefront:

```liquid
{% comment %} In product-template.liquid {% endcomment %}
{% if product.metafields.translation.available_languages %}
  <div class="translation-widget">
    <button class="translate-btn" data-product-id="{{ product.id }}">
      Translate Product
    </button>
    <div class="language-selector">
      {% for lang in product.metafields.translation.available_languages %}
        <button data-lang="{{ lang.code }}">{{ lang.name }}</button>
      {% endfor %}
    </div>
  </div>
{% endif %}
```

### Custom CSS
```css
/* Translation widget styles */
.translation-widget {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
}

.translate-btn {
  background: #5c6ac4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.translate-btn:hover {
  background: #4a56a2;
}

.language-selector {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.language-selector button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}
```

### Webhook Handlers
Extend webhook functionality:

```javascript
// Custom webhook handler
app.post('/webhook/products/create', async (req, res) => {
  const product = req.body;
  
  // Custom logic before translation
  if (product.tags.includes('auto-translate')) {
    await translateProduct(product.id, 'es');
  }
  
  // Continue with default processing
  // ...
});
```

## 🔧 Advanced Configuration

### Database Schema
```sql
-- Stores installation data
CREATE TABLE shopify_installations (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  api_key TEXT,
  settings JSONB DEFAULT '{}',
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores translation history
CREATE TABLE translation_history (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(100) NOT NULL,
  source_lang VARCHAR(10),
  target_lang VARCHAR(10) NOT NULL,
  original_text TEXT,
  translated_text TEXT,
  character_count INTEGER,
  api_cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores app settings per store
CREATE TABLE shopify_settings (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  auto_translate_products BOOLEAN DEFAULT false,
  default_target_lang VARCHAR(10) DEFAULT 'en',
  translate_titles BOOLEAN DEFAULT true,
  translate_descriptions BOOLEAN DEFAULT true,
  translate_metafields BOOLEAN DEFAULT false,
  cache_enabled BOOLEAN DEFAULT true,
  cache_duration INTEGER DEFAULT 86400,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Production Deployment

#### Heroku
```bash
# Create Heroku app
heroku create forcekeys-shopify-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set FORCEKEYS_API_KEY=your_forcekeys_key

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

#### AWS Elastic Beanstalk
```bash
# Initialize EB
eb init -p node.js forcekeys-shopify-app

# Create environment
eb create forcekeys-shopify-prod

# Set environment variables
eb setenv SHOPIFY_API_KEY=your_key SHOPIFY_API_SECRET=your_secret

# Deploy
eb deploy
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/forcekeys_shopify
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=forcekeys_shopify
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 📊 Usage Statistics

The app tracks:
- **Total translations**: Number of translations performed
- **Characters translated**: Total character count
- **Store statistics**: Per-store usage metrics
- **API costs**: Translation cost tracking
- **Performance metrics**: Response times and success rates

View statistics in the **Shopify admin dashboard** under **Apps → Forcekeys Translation → Analytics**

## 🔒 Security

### OAuth 2.0 Security
- **Secure token storage** with encryption
- **Scope validation** for each API call
- **Token refresh** mechanism
- **Session management** with secure cookies

### Data Protection
- **API key encryption** at rest
- **Secure webhook validation**
- **Data encryption** in transit (HTTPS)
- **Regular security audits**

### Compliance
- **GDPR compliant** data handling
- **Shopify API compliance**
- **PCI DSS** considerations for e-commerce
- **Data retention policies**

## 🐛 Troubleshooting

### Common Issues

**1. "Installation Failed" Error**
- Verify Shopify API credentials
- Check redirect URI configuration
- Ensure scopes are properly configured
- Check network connectivity

**2. "Translation Not Working"**
- Verify Forcekeys API key is valid
- Check API quota availability
- Ensure webhooks are properly registered
- Check server logs for errors

**3. "Webhook Delivery Failed"**
- Verify webhook secret matches
- Check server URL is accessible
- Ensure SSL certificate is valid
- Check firewall settings

**4. "Slow Performance"**
- Enable Redis caching
- Optimize database queries
- Implement request batching
- Monitor server resources

### Debug Mode
Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=forcekeys-shopify:*

# Or in .env file
DEBUG=forcekeys-shopify:*
```

Check logs:
```bash
# View application logs
npm run logs

# View database logs
npm run db:logs

# View webhook deliveries
npm run webhooks:list
```

## 📈 Performance Optimization

### Caching Strategies
1. **Redis caching** for translation results
2. **Database query caching**
3. **CDN for static assets**
4. **Shopify API rate limit optimization**

### Database Optimization
1. **Index frequently queried columns**
2. **Regular database maintenance**
3. **Query optimization**
4. **Connection pooling**

### API Optimization
1. **Batch API requests**
2. **Implement retry logic**
3. **Use webhooks instead of polling**
4. **Cache Shopify API responses**

## 🤝 Contributing

We welcome contributions! Here's how to help:

### Development Setup
```bash
# Fork and clone
git clone https://github.com/your-username/shopify-translation-app.git
cd shopify-translation-app

# Install dependencies
npm install

# Set up development database
npm run db:setup

# Run tests
npm test

# Start development server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Code Standards
- Follow [Shopify Polaris](https://polaris.shopify.com/) design guidelines
- Use [ESLint](https://eslint.org/) with Shopify config
- Write comprehensive tests
- Update documentation with changes

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit pull request

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Forcekeys

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

### Documentation
- [Official Documentation](https://forcekeys.com/docs/shopify)
- [API Reference](https://forcekeys.com/api-docs)
- [Shopify Integration Guide](https://forcekeys.com/docs/shopify/integration)
- [FAQ](https://forcekeys.com/faq/shopify)

### Community Support
- [GitHub Issues](https://github.com/forcekeys/shopify-translation-app/issues)
- [Shopify Community Forum](https://community.shopify.com/)
- [Community Discord](https://discord.gg/forcekeys)

### Professional Support
- **Email**: support@forcekeys.com
- **Priority Support**: Available for Enterprise plans
- **Custom Development**: Contact sales@forcekeys.com
- **Dedicated Account Manager**: For high-volume stores

### Bug Reports
Please report bugs on [GitHub Issues](https://github.com/forcekeys/shopify-translation-app/issues) with:
1. Shopify store URL
2. App version
