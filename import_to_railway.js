const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: 'hayabusa.proxy.rlwy.net',
  port: 17829,
  user: 'root',
  password: 'uwOJGgvThUtgMfxiPYUHraswPHTocqWg',
  database: 'railway',
  connectTimeout: 20000 // 20 seconds timeout
};

async function executeWithRetry(query, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let connection;
    try {
      connection = await mysql.createConnection(config);
      await connection.query(query);
      await connection.end();
      return; // Success!
    } catch (err) {
      if (connection) {
        try { await connection.end(); } catch (e) {}
      }
      console.warn(`⚠️ Query failed on attempt ${attempt}/${retries}: ${err.message}`);
      if (attempt === retries) {
        throw err; // Out of retries
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function importSqlFile(filePath) {
  console.log(`Reading SQL file: ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic parsing: remove comments, split by semicolon
  const lines = content.split('\n');
  let currentQuery = '';
  const queries = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.startsWith('#')) {
      continue;
    }
    currentQuery += line + '\n';
    if (trimmed.endsWith(';')) {
      queries.push(currentQuery.trim());
      currentQuery = '';
    }
  }

  console.log(`Found ${queries.length} queries to execute.`);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`Executing query #${i + 1}/${queries.length}...`);
    try {
      await executeWithRetry(query);
      // Small pause to prevent rate limiting / proxy reset
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`❌ Permanent error executing query #${i + 1}:`);
      console.error(query);
      console.error(err.message);
      throw err;
    }
  }
  console.log(`✅ Successfully imported ${path.basename(filePath)}`);
}

async function cleanDatabase() {
  console.log('Cleaning existing tables...');
  const dropQueries = [
    'SET FOREIGN_KEY_CHECKS = 0',
    'DROP TABLE IF EXISTS password_reset_tokens',
    'DROP TABLE IF EXISTS otp_verifications',
    'DROP TABLE IF EXISTS login_activity',
    'DROP TABLE IF EXISTS sessions',
    'DROP TABLE IF EXISTS users',
    'DROP TABLE IF EXISTS history',
    'DROP TABLE IF EXISTS likes',
    'DROP TABLE IF EXISTS playlist_songs',
    'DROP TABLE IF EXISTS playlists',
    'DROP TABLE IF EXISTS songs',
    'DROP TABLE IF EXISTS genres',
    'DROP TABLE IF EXISTS albums',
    'DROP TABLE IF EXISTS artists',
    'DROP TABLE IF EXISTS creators',
    'SET FOREIGN_KEY_CHECKS = 1'
  ];

  for (const query of dropQueries) {
    await executeWithRetry(query);
  }
  console.log('✅ Clean complete.');
}

async function main() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const seedPath = path.join(__dirname, 'database', 'seed.sql');
    
    await cleanDatabase();
    await importSqlFile(schemaPath);
    await importSqlFile(seedPath);
    
    console.log('🎉 Database shift/migration to Railway completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

main();
