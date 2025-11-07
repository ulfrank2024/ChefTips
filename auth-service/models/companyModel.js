const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const CompanyModel = {
    async createCompany(name) {
        const result = await pool.query("INSERT INTO companies (name) VALUES ($1) RETURNING *", [name]);
        return result.rows[0];
    },

    async getCompanyById(companyId) {
        const result = await pool.query("SELECT * FROM companies WHERE id = $1", [companyId]);
        return result.rows[0];
    },
    async getDepartmentsByCompanyId(companyId) {
        const query = 'SELECT * FROM departments WHERE company_id = $1';
        const values = [companyId];
        const { rows } = await pool.query(query, values);
        return rows;
    }
}

module.exports = {
    CompanyModel,
};
