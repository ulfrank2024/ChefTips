
const { Client } = require('pg');

async function checkPlansTable() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Successfully connected to the database.');

        const res = await client.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'plans'
            );
        `);

        const tableExists = res.rows[0].exists;
        if (tableExists) {
            console.log('Table "plans" exists in the database.');
        } else {
            console.log('Table "plans" DOES NOT exist in the database.');
        }
    } catch (err) {
        console.error('Error checking for plans table:', err);
    } finally {
        await client.end();
    }
}

checkPlansTable();
