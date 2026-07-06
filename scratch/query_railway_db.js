const mysql = require('mysql2/promise');

const config = {
  host: 'hayabusa.proxy.rlwy.net',
  port: 17829,
  user: 'root',
  password: 'uwOJGgvThUtgMfxiPYUHraswPHTocqWg',
  database: 'railway',
  connectTimeout: 20000 // 20 seconds timeout
};

async function main() {
    try {
        console.log("Connecting to Railway DB...");
        const pool = mysql.createPool(config);

        const [creators] = await pool.query("SELECT * FROM creators");
        console.log("=== CREATORS ===");
        console.log(creators);

        const [songs] = await pool.query("SELECT id, title, artist_id, uploaded_by FROM songs WHERE uploaded_by IS NOT NULL");
        console.log("=== SONGS ===");
        console.log(songs);

        const [users] = await pool.query("SELECT id, name, email, role FROM users");
        console.log("=== USERS ===");
        console.log(users);

        await pool.end();
    } catch (e) {
        console.error("Error querying database:", e);
    }
}

main();
