const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway',
    ssl: process.env.DB_HOST?.includes('aivencloud.com') ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

function isConnectionError(err) {
    if (!err) return false;
    const code = err.code || '';
    const msg = err.message || '';
    return (
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        msg.includes('Connection lost') ||
        msg.includes('closed the connection')
    );
}

const originalQuery = pool.query.bind(pool);
const originalExecute = pool.execute.bind(pool);

pool.query = async function (...args) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await originalQuery(...args);
        } catch (err) {
            if (isConnectionError(err) && attempt < maxRetries) {
                console.warn(`[DB] Connection lost on attempt ${attempt}/${maxRetries}. Retrying in 500ms...`);
                await new Promise((r) => setTimeout(r, 500));
                continue;
            }
            if (isConnectionError(err)) {
                err.message = `Database connection failed: The server closed the connection or database host is offline (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}).`;
            }
            throw err;
        }
    }
};

pool.execute = async function (...args) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await originalExecute(...args);
        } catch (err) {
            if (isConnectionError(err) && attempt < maxRetries) {
                console.warn(`[DB] Connection lost on attempt ${attempt}/${maxRetries}. Retrying in 500ms...`);
                await new Promise((r) => setTimeout(r, 500));
                continue;
            }
            if (isConnectionError(err)) {
                err.message = `Database connection failed: The server closed the connection or database host is offline (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}).`;
            }
            throw err;
        }
    }
};

module.exports = pool;
