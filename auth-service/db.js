const { Pool } = require('pg');

console.log('--- DB Debug ---');
console.log('DATABASE_URL in db.js:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DATABASE_URL value (partial):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'N/A'); // Log partial value to avoid exposing full secret in logs

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

console.log('SSL config in db.js:', pool.options.ssl); // Added for debugging
console.log('Pool initialized in db.js:', !!pool); // Check if pool object exists

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
console.log('Pool exported from db.js');
console.log('--- End DB Debug ---');
