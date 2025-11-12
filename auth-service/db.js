const { Pool } = require('pg');

const sslConfig = process.env.DB_SSL_ENABLED === 'true'
    ? { ssl: { rejectUnauthorized: false } }
    : {};

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ...sslConfig
});

module.exports = pool;
