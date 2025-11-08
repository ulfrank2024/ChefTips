const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error('FATAL_ERROR: DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
