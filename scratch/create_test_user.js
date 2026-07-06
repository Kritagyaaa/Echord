const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const bcrypt = require('bcryptjs');
const pool = require('../backend/db');

async function main() {
    try {
        const email = 'test_shubham@example.com';
        const password = 'password123';
        const passwordHash = bcrypt.hashSync(password, 10);

        // Delete if exists
        await pool.query('DELETE FROM users WHERE email = ?', [email]);

        // Insert verified user
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
            ['Test Shubham', email, passwordHash, 'user', 1]
        );
        console.log("Successfully created test user:", email, "with password:", password);
    } catch(e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
main();
