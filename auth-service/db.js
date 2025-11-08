const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Adding SSL configuration for Render PostgreSQL
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
