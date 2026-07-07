const path = require("path");
const fs = require("fs");
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});
const mysql = require("mysql2/promise");

async function initDb() {
  console.log("Starting database initialization...");
  const dbName = process.env.DB_NAME || "spotify_clone";
  
  // 1. Connect without database name first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log(`Creating database \`${dbName}\` if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database \`${dbName}\` checked/created successfully.`);
  } finally {
    await connection.end();
  }

  // 2. Connect specifying the database
  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: dbName,
    multipleStatements: true, // Allow executing multiple statements separated by ;
  });

  try {
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const seedPath = path.join(__dirname, "..", "database", "seed.sql");

    console.log("Reading schema.sql...");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    console.log("Applying schema.sql...");
    await dbConnection.query(schemaSql);
    console.log("Schema applied successfully.");

    console.log("Reading seed.sql...");
    const seedSql = fs.readFileSync(seedPath, "utf8");
    console.log("Applying seed.sql...");
    await dbConnection.query(seedSql);
    console.log("Seeding completed successfully.");

    console.log("🎉 Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await dbConnection.end();
  }
}

initDb();
