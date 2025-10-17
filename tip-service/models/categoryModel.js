const { pool } = require("../config/db");

const CategoryModel = {
    async createCategory(companyId, departmentId, name, isDualRole) {
        const result = await pool.query(
            'INSERT INTO categories (company_id, department_id, name, is_dual_role) VALUES ($1, $2, $3, $4) RETURNING *'
            ,
            [companyId, departmentId, name, isDualRole]
        );
        return result.rows[0];
    },

    async getCategoriesByCompany(companyId) {
        const result = await pool.query(
            `SELECT c.*, d.name as department_name, d.department_type 
             FROM categories c 
             JOIN departments d ON c.department_id = d.id 
             WHERE c.company_id = $1 
             ORDER BY d.name, c.name`,
            [companyId]
        );
        return result.rows;
    },

    async updateCategory(categoryId, updates) {
        const setClauses = [];
        const values = [];
        let i = 1;
        for (const key in updates) {
            if (updates[key] !== undefined) {
                setClauses.push(`${key} = $${i++}`);
                values.push(updates[key]);
            }
        }
        if (setClauses.length === 0) return null;

        values.push(categoryId);
        const query = `UPDATE categories SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async deleteCategory(categoryId) {
        await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    },
};

module.exports = { CategoryModel };