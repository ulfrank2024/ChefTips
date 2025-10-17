const { pool } = require("../config/db"); // Assuming a db config file for the pool

const DepartmentModel = {
    async createDepartment(companyId, name, departmentType, distribution) {
        const result = await pool.query(
            'INSERT INTO departments (company_id, name, department_type, category_distribution) VALUES ($1, $2, $3, $4) RETURNING *'
            ,
            [companyId, name, departmentType, distribution]
        );
        return result.rows[0];
    },

    async getDepartmentsByCompany(companyId) {
        const result = await pool.query('SELECT * FROM departments WHERE company_id = $1 ORDER BY created_at', [companyId]);
        return result.rows;
    },

    async updateDepartment(departmentId, companyId, name, departmentType, distribution) {
        const result = await pool.query(
            'UPDATE departments SET name = $1, department_type = $2, category_distribution = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5 RETURNING *'
            ,
            [name, departmentType, distribution, departmentId, companyId]
        );
        return result.rows[0];
    },

    async deleteDepartment(departmentId, companyId) {
        await pool.query('DELETE FROM departments WHERE id = $1 AND company_id = $2', [departmentId, companyId]);
    },
};

module.exports = { DepartmentModel };