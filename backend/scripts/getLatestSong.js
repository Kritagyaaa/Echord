const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');

(async () => {
  try {
    const [rows] = await db.query('SELECT * FROM songs ORDER BY id DESC LIMIT 1');
    if (!rows || rows.length === 0) {
      console.log('No songs found');
      process.exit(0);
    }
    console.log(JSON.stringify(rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB query failed', err.message || err);
    process.exit(1);
  }
})();
