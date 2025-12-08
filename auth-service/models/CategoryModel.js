const { pool } = require('../db');

class CategoryModel {
    static async createCategory(companyId, name, isTipDistributionPool = false) {
        const query = `
            INSERT INTO categories (company_id, name, is_tip_distribution_pool)
            VALUES ($1, $2, $3)
            RETURNING id, name, is_tip_distribution_pool, created_at, updated_at;
        `;
        const { rows } = await pool.query(query, [companyId, name, isTipDistributionPool]);
        return rows[0];
    }

    static async getCategoriesByCompany(companyId) {
        const query = `
            SELECT id, name, is_tip_distribution_pool
            FROM categories
            WHERE company_id = $1
            ORDER BY name ASC;
        `;
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    }

    static async getCategoryById(categoryId) {
        const query = `
            SELECT id, company_id, name, is_tip_distribution_pool
            FROM categories
            WHERE id = $1;
        `;
        const { rows } = await pool.query(query, [categoryId]);
        return rows[0];
    }

    static async updateCategory(categoryId, name, isTipDistributionPool) {
        const query = `
            UPDATE categories
            SET name = $1, is_tip_distribution_pool = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, name, is_tip_distribution_pool, updated_at;
        `;
        const { rows } = await pool.query(query, [name, isTipDistributionPool, categoryId]);
        return rows[0];
    }

    static async deleteCategory(categoryId) {
        const query = `
            DELETE FROM categories
            WHERE id = $1
            RETURNING id;
        `;
        const { rows } = await pool.query(query, [categoryId]);
        return rows[0];
    }
}

module.exports = CategoryModel;
