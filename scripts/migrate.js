#!/usr/bin/env node

/**
 * Database migration script for Forcekeys Shopify App
 * 
 * Usage:
 *   node scripts/migrate.js up     - Run migrations
 *   node scripts/migrate.js down   - Rollback migrations
 *   node scripts/migrate.js status - Show migration status
 *   node scripts/migrate.js create <name> - Create new migration
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { config } = require('../config');

const execAsync = promisify(exec);

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
    this.migrationsTable = 'migration_history';
    this.dbType = config.database.type || 'postgres';
  }

  /**
   * Get database connection string
   */
  getConnectionString() {
    const dbUrl = config.database.url;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not configured');
    }
    return dbUrl;
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => ({
      name: file,
      path: path.join(this.migrationsDir, file),
      version: this.extractVersion(file)
    }));
  }

  /**
   * Extract version number from filename
   */
  extractVersion(filename) {
    const match = filename.match(/^(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Execute SQL command
   */
  async executeSQL(sql) {
    const connectionString = this.getConnectionString();
    
    if (this.dbType === 'postgres') {
      return this.executePostgreSQL(sql, connectionString);
    } else if (this.dbType === 'mysql') {
      return this.executeMySQL(sql, connectionString);
    } else {
      throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Execute PostgreSQL command
   */
  async executePostgreSQL(sql, connectionString) {
    try {
      const { stdout, stderr } = await execAsync(
        `psql "${connectionString}" -c "${sql.replace(/"/g, '\\"')}"`
      );
      
      if (stderr && !stderr.includes('NOTICE:')) {
        console.error('PostgreSQL error:', stderr);
        throw new Error(stderr);
      }
      
      return stdout;
    } catch (error) {
      // Try alternative method with environment variable
      try {
        const { stdout, stderr } = await execAsync(
          `PGPASSWORD=${this.extractPassword(connectionString)} psql -h ${this.extractHost(connectionString)} -U ${this.extractUser(connectionString)} -d ${this.extractDatabase(connectionString)} -c "${sql.replace(/"/g, '\\"')}"`
        );
        
        if (stderr && !stderr.includes('NOTICE:')) {
          console.error('PostgreSQL error:', stderr);
          throw new Error(stderr);
        }
        
        return stdout;
      } catch (error2) {
        console.error('Failed to execute PostgreSQL command:', error2.message);
        throw error2;
      }
    }
  }

  /**
   * Execute MySQL command
   */
  async executeMySQL(sql, connectionString) {
    try {
      const { stdout, stderr } = await execAsync(
        `mysql --execute="${sql.replace(/"/g, '\\"')}" --host=${this.extractHost(connectionString)} --user=${this.extractUser(connectionString)} --password=${this.extractPassword(connectionString)} ${this.extractDatabase(connectionString)}`
      );
      
      if (stderr) {
        console.error('MySQL error:', stderr);
        throw new Error(stderr);
      }
      
      return stdout;
    } catch (error) {
      console.error('Failed to execute MySQL command:', error.message);
      throw error;
    }
  }

  /**
   * Extract components from connection string
   */
  extractHost(connectionString) {
    if (this.dbType === 'postgres') {
      const match = connectionString.match(/@([^:]+):/);
      return match ? match[1] : 'localhost';
    } else {
      const match = connectionString.match(/host=([^;]+)/);
      return match ? match[1] : 'localhost';
    }
  }

  extractUser(connectionString) {
    if (this.dbType === 'postgres') {
      const match = connectionString.match(/\/\/([^:]+):/);
      return match ? match[1] : 'postgres';
    } else {
      const match = connectionString.match(/user=([^;]+)/);
      return match ? match[1] : 'root';
    }
  }

  extractPassword(connectionString) {
    if (this.dbType === 'postgres') {
      const match = connectionString.match(/\/\/[^:]+:([^@]+)@/);
      return match ? match[1] : '';
    } else {
      const match = connectionString.match(/password=([^;]+)/);
      return match ? match[1] : '';
    }
  }

  extractDatabase(connectionString) {
    if (this.dbType === 'postgres') {
      const match = connectionString.match(/\/[^?]+$/);
      return match ? match[0].substring(1) : 'forcekeys_shopify';
    } else {
      const match = connectionString.match(/database=([^;]+)/);
      return match ? match[1] : 'forcekeys_shopify';
    }
  }

  /**
   * Create migrations table if not exists
   */
  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.executeSQL(createTableSQL);
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations() {
    await this.ensureMigrationsTable();
    
    try {
      const result = await this.executeSQL(
        `SELECT version, name, applied_at FROM ${this.migrationsTable} ORDER BY version`
      );
      
      // Parse result based on database type
      if (this.dbType === 'postgres') {
        const lines = result.split('\n').filter(line => line.trim() && !line.includes('version'));
        return lines.map(line => {
          const [version, name, applied_at] = line.split('|').map(s => s.trim());
          return { version: parseInt(version), name, applied_at };
        });
      } else {
        // MySQL output parsing
        const lines = result.split('\n').filter(line => line.trim() && !line.includes('version'));
        return lines.map(line => {
          const parts = line.split('\t');
          return { 
            version: parseInt(parts[0]), 
            name: parts[1], 
            applied_at: parts[2] 
          };
        });
      }
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Run migrations
   */
  async up() {
    console.log('Running migrations...');
    
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    let migratedCount = 0;
    
    for (const migration of migrationFiles) {
      if (!appliedVersions.has(migration.version)) {
        console.log(`Applying migration: ${migration.name}`);
        
        try {
          // Read and execute migration SQL
          const sql = fs.readFileSync(migration.path, 'utf8');
          await this.executeSQL(sql);
          
          // Record migration
          await this.executeSQL(
            `INSERT INTO ${this.migrationsTable} (version, name) VALUES (${migration.version}, '${migration.name}')`
          );
          
          migratedCount++;
          console.log(`✓ Applied: ${migration.name}`);
        } catch (error) {
          console.error(`✗ Failed to apply migration ${migration.name}:`, error.message);
          throw error;
        }
      }
    }
    
    if (migratedCount === 0) {
      console.log('No new migrations to apply.');
    } else {
      console.log(`Successfully applied ${migratedCount} migration(s).`);
    }
  }

  /**
   * Rollback migrations
   */
  async down(count = 1) {
    console.log(`Rolling back ${count} migration(s)...`);
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations.slice(-count).reverse();
    
    if (migrationsToRollback.length === 0) {
      console.log('No migrations to rollback.');
      return;
    }
    
    for (const migration of migrationsToRollback) {
      console.log(`Rolling back: ${migration.name}`);
      
      try {
        // Find and execute rollback SQL if exists
        const rollbackFile = migration.name.replace('.sql', '_down.sql');
        const rollbackPath = path.join(this.migrationsDir, rollbackFile);
        
        if (fs.existsSync(rollbackPath)) {
          const sql = fs.readFileSync(rollbackPath, 'utf8');
          await this.executeSQL(sql);
        } else {
          console.warn(`No rollback script found for ${migration.name}`);
        }
        
        // Remove migration record
        await this.executeSQL(
          `DELETE FROM ${this.migrationsTable} WHERE version = ${migration.version}`
        );
        
        console.log(`✓ Rolled back: ${migration.name}`);
      } catch (error) {
        console.error(`✗ Failed to rollback migration ${migration.name}:`, error.message);
        throw error;
      }
    }
    
    console.log(`Successfully rolled back ${migrationsToRollback.length} migration(s).`);
  }

  /**
   * Show migration status
   */
  async status() {
    console.log('Migration Status:');
    console.log('================');
    
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    console.log(`Database: ${this.dbType}`);
    console.log(`Migrations directory: ${this.migrationsDir}`);
    console.log('');
    
    console.log('Applied migrations:');
    appliedMigrations.forEach(m => {
      console.log(`  ✓ ${m.version.toString().padStart(3, '0')}_${m.name.padEnd(40)} ${m.applied_at}`);
    });
    
    console.log('');
    console.log('Pending migrations:');
    
    let hasPending = false;
    migrationFiles.forEach(migration => {
      if (!appliedVersions.has(migration.version)) {
        console.log(`  ○ ${migration.name.padEnd(50)} (pending)`);
        hasPending = true;
      }
    });
    
    if (!hasPending) {
      console.log('  No pending migrations.');
    }
    
    console.log('');
    console.log(`Total: ${appliedMigrations.length} applied, ${migrationFiles.length - appliedMigrations.length} pending`);
  }

  /**
   * Create new migration
   */
  async create(name) {
    if (!name) {
      throw new Error('Migration name is required');
    }
    
    const migrationFiles = this.getMigrationFiles();
    const lastVersion = migrationFiles.length > 0 
      ? Math.max(...migrationFiles.map(m => m.version))
      : 0;
    
    const newVersion = lastVersion + 1;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filename = `${newVersion.toString().padStart(3, '0')}_${name}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Version: ${newVersion}

-- UP migration (applied when migrating up)

-- Add your SQL statements here
-- Example:
-- CREATE TABLE example_table (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- DOWN migration (applied when rolling back)
-- This section should be in a separate file: ${newVersion.toString().padStart(3, '0')}_${name}_down.sql
-- Example:
-- DROP TABLE IF EXISTS example_table;
`;

    fs.writeFileSync(filepath, template);
    console.log(`Created migration: ${filename}`);
    console.log(`Path: ${filepath}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new MigrationManager();
  
  try {
    switch (command) {
      case 'up':
        await manager.up();
        break;
      
      case 'down':
        const count = args[1] ? parseInt(args[1]) : 1;
        await manager.down(count);
        break;
      
      case 'status':
        await manager.status();
        break;
      
      case 'create':
        const name = args[1];
        if (!name) {
          console.error('Error: Migration name is required');
          console.error('Usage: node scripts/migrate.js create <migration_name>');
          process.exit(1);
        }
        await manager.create(name);
        break;
      
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Forcekeys Shopify App - Migration Tool
Usage: node scripts/migrate.js <command> [options]

Commands:
  up [count]           Run pending migrations
  down [count]         Rollback migrations (default: 1)
  status               Show migration status
  create <name>        Create new migration
  help                 Show this help message

Examples:
  node scripts/migrate.js up
  node scripts/migrate.js down 2
  node scripts/migrate.js status
  node scripts/migrate.js create add_new_feature

Environment:
  DATABASE_URL         Database connection string
  NODE_ENV             Environment (development/production)
  `);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MigrationManager;