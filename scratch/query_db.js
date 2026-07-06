const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const pool = require('../backend/db');

async function main() {
    try {
        console.log("Connecting to DB with Host:", process.env.DB_HOST);
        const [creators] = await pool.query("SELECT * FROM creators");
        console.log("=== CREATORS ===");
        console.log(creators);

        const [songs] = await pool.query("SELECT id, title, artist_id, uploaded_by FROM songs WHERE uploaded_by IS NOT NULL");
        console.log("=== SONGS ===");
        console.log(songs);

        const [users] = await pool.query("SELECT id, name, email, role FROM users");
        console.log("=== USERS ===");
        console.log(users);
    } catch (e) {
        console.error("Error querying database:", e);
    } finally {
        await pool.end();
    }
}

main();
