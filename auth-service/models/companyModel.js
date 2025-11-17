const pool = require('../db');

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
    },
    async getAllCompanies() {
        const result = await pool.query("SELECT * FROM companies");
        return result.rows;
    },
    async updateCompanyStatus(companyId, isActive) {
        const result = await pool.query(
            "UPDATE companies SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [isActive, companyId]
        );
        return result.rows[0];
    }
}

module.exports = {
    CompanyModel,
};
