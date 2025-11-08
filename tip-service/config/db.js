const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Nécessaire pour Render si l'URL ne le gère pas directement
    }
});

module.exports = { pool };