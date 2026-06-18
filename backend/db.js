const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const rootDir = path.resolve(__dirname, '..');
const databaseDir = path.join(rootDir, 'database');
const databasePath = path.join(databaseDir, 'spotify.sqlite');
const schemaPath = path.join(databaseDir, 'schema.sql');

function createDatabase() {
  fs.mkdirSync(databaseDir, { recursive: true });

  const database = new DatabaseSync(databasePath);
  const schema = fs.readFileSync(schemaPath, 'utf8');

  database.exec('PRAGMA foreign_keys = ON;');
  database.exec(schema);

  return database;
}

module.exports = { createDatabase, databasePath };
