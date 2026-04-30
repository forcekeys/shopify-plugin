/**
 * Basic tests for Forcekeys Shopify App
 * 
 * These tests verify the core functionality of the application
 */

const assert = require('assert');
const { config, validateConfig } = require('../config');
const auth = require('../auth');

describe('Forcekeys Shopify App - Basic Tests', () => {
  
  describe('Configuration', () => {
    it('should have valid configuration structure', () => {
      assert(config, 'Configuration should exist');
      assert(config.shopify, 'Shopify configuration should exist');
      assert(config.forcekeys, 'Forcekeys configuration should exist');
      assert(config.server, 'Server configuration should exist');
      assert(config.database, 'Database configuration should exist');
    });

    it('should have required Shopify configuration', () => {
      assert(config.shopify.apiKey !== undefined, 'Shopify API key should be defined');
      assert(config.shopify.apiSecret !== undefined, 'Shopify API secret should be defined');
      assert(config.shopify.scopes, 'Shopify scopes should be defined');
      assert(config.shopify.appUrl, 'Shopify app URL should be defined');
    });

    it('should have required Forcekeys configuration', () => {
      assert(config.forcekeys.apiKey !== undefined, 'Forcekeys API key should be defined');
      assert(config.forcekeys.apiUrl, 'Forcekeys API URL should be defined');
      assert(config.forcekeys.endpoints, 'Forcekeys endpoints should be defined');
    });

    it('should have valid server configuration', () => {
      assert(config.server.port, 'Server port should be defined');
      assert(config.server.nodeEnv, 'Node environment should be defined');
      assert(['development', 'production', 'test'].includes(config.server.nodeEnv), 
        'Node environment should be valid');
    });

    it('should have valid translation configuration', () => {
      assert(config.translation.defaultSourceLang, 'Default source language should be defined');
      assert(config.translation.defaultTargetLang, 'Default target language should be defined');
      assert(Array.isArray(config.languages), 'Languages should be an array');
      assert(config.languages.length > 0, 'Should have at least one language');
    });
  });

  describe('Authentication Module', () => {
    it('should generate valid Shopify OAuth URL', () => {
      const shop = 'test-store.myshopify.com';
      const redirectUri = 'https://example.com/auth/callback';
      
      const authUrl = auth.generateAuthUrl(shop, redirectUri);
      
      assert(authUrl, 'Auth URL should be generated');
      assert(authUrl.includes(shop), 'Auth URL should contain shop domain');
      assert(authUrl.includes('admin/oauth/authorize'), 'Auth URL should be Shopify OAuth URL');
      assert(authUrl.includes('client_id='), 'Auth URL should contain client_id parameter');
      assert(authUrl.includes('scope='), 'Auth URL should contain scope parameter');
      assert(authUrl.includes('redirect_uri='), 'Auth URL should contain redirect_uri parameter');
    });

    it('should validate shop domain format', () => {
      const validShop = 'test-store.myshopify.com';
      const invalidShop1 = 'test-store.shopify.com';
      const invalidShop2 = 'test-store';
      const invalidShop3 = '.myshopify.com';
      
      assert(auth.validateShopDomain(validShop), 'Valid shop domain should pass validation');
      assert(!auth.validateShopDomain(invalidShop1), 'Invalid shop domain should fail validation');
      assert(!auth.validateShopDomain(invalidShop2), 'Invalid shop domain should fail validation');
      assert(!auth.validateShopDomain(invalidShop3), 'Invalid shop domain should fail validation');
    });

    it('should generate and verify nonce', () => {
      const nonce = auth.generateNonce();
      
      assert(nonce, 'Nonce should be generated');
      assert(typeof nonce === 'string', 'Nonce should be a string');
      assert(nonce.length === 32, 'Nonce should be 32 characters (16 bytes hex)');
      
      const isValid = auth.verifyNonce(nonce, nonce);
      assert(isValid, 'Same nonce should verify successfully');
      
      const isInvalid = auth.verifyNonce(nonce, 'different-nonce');
      assert(!isInvalid, 'Different nonce should fail verification');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration without throwing errors in test mode', () => {
      // Save original environment
      const originalEnv = process.env.NODE_ENV;
      
      try {
        // Set to test mode to avoid exit on validation failure
        process.env.NODE_ENV = 'test';
        
        // This should not throw in test mode
        validateConfig();
        
        // Restore environment
        process.env.NODE_ENV = originalEnv;
      } catch (error) {
        // Restore environment on error
        process.env.NODE_ENV = originalEnv;
        throw error;
      }
    });
  });

  describe('Package.json', () => {
    const packageJson = require('../package.json');

    it('should have required fields', () => {
      assert(packageJson.name, 'Package should have name');
      assert(packageJson.version, 'Package should have version');
      assert(packageJson.description, 'Package should have description');
      assert(packageJson.main, 'Package should have main entry point');
      assert(packageJson.scripts, 'Package should have scripts');
      assert(packageJson.dependencies, 'Package should have dependencies');
    });

    it('should have correct app name', () => {
      assert(packageJson.name === 'forcekeys-shopify-app', 
        'Package name should be forcekeys-shopify-app');
    });

    it('should have required dependencies', () => {
      const requiredDeps = ['express', 'axios', 'dotenv'];
      
      requiredDeps.forEach(dep => {
        assert(packageJson.dependencies[dep], `Should have ${dep} dependency`);
      });
    });

    it('should have required scripts', () => {
      const requiredScripts = ['start'];
      
      requiredScripts.forEach(script => {
        assert(packageJson.scripts[script], `Should have ${script} script`);
      });
    });
  });

  describe('Environment Variables', () => {
    it('should have .env.example file', () => {
      const fs = require('fs');
      const path = require('path');
      
      const envExamplePath = path.join(__dirname, '../.env.example');
      assert(fs.existsSync(envExamplePath), '.env.example file should exist');
      
      const content = fs.readFileSync(envExamplePath, 'utf8');
      assert(content.includes('SHOPIFY_API_KEY'), '.env.example should contain SHOPIFY_API_KEY');
      assert(content.includes('SHOPIFY_API_SECRET'), '.env.example should contain SHOPIFY_API_SECRET');
      assert(content.includes('FORCEKEYS_API_KEY'), '.env.example should contain FORCEKEYS_API_KEY');
      assert(content.includes('DATABASE_URL'), '.env.example should contain DATABASE_URL');
    });
  });

  describe('File Structure', () => {
    const fs = require('fs');
    const path = require('path');

    it('should have required directories', () => {
      const requiredDirs = [
        'migrations',
        'public',
        'scripts',
        'test'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        assert(fs.existsSync(dirPath), `${dir} directory should exist`);
      });
    });

    it('should have required files', () => {
      const requiredFiles = [
        'index.js',
        'config.js',
        'auth.js',
        'package.json',
        'README.md',
        'Dockerfile',
        '.dockerignore',
        '.env.example'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        assert(fs.existsSync(filePath), `${file} should exist`);
      });
    });

    it('should have migration files', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      
      assert(migrationFiles.length > 0, 'Should have at least one migration file');
      
      const initialMigration = migrationFiles.find(f => f.includes('initial_schema'));
      assert(initialMigration, 'Should have initial schema migration');
    });
  });

  describe('Docker Configuration', () => {
    const fs = require('fs');
    const path = require('path');

    it('should have valid Dockerfile', () => {
      const dockerfilePath = path.join(__dirname, '../Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      assert(content.includes('FROM node:'), 'Dockerfile should use Node.js base image');
      assert(content.includes('WORKDIR /app'), 'Dockerfile should set working directory');
      assert(content.includes('COPY package*.json ./'), 'Dockerfile should copy package files');
      assert(content.includes('EXPOSE 3000'), 'Dockerfile should expose port 3000');
      assert(content.includes('CMD ["node", "index.js"]'), 'Dockerfile should have correct CMD');
    });

    it('should have .dockerignore file', () => {
      const dockerignorePath = path.join(__dirname, '../.dockerignore');
      const content = fs.readFileSync(dockerignorePath, 'utf8');
      
      assert(content.includes('node_modules'), '.dockerignore should ignore node_modules');
      assert(content.includes('.env'), '.dockerignore should ignore .env files');
      assert(content.includes('.git'), '.dockerignore should ignore .git');
    });
  });
});

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
console.error = () => {};

// Run tests if called directly
if (require.main === module) {
  const Mocha = require('mocha');
  
  const mocha = new Mocha({
    timeout: 10000,
    reporter: 'spec'
  });
  
  mocha.suite.emit('pre-require', global, null, mocha);
  
  mocha.run(failures => {
    console.error = originalConsoleError;
    process.exit(failures ? 1 : 0);
  });
}

module.exports = {
  config,
  auth
};
