const pool = require('../db');

const MembershipModel = {
    async createMembership(userId, companyId, categoryId, can_cash_out = false) { // Changed role to categoryId
        const result = await pool.query(
            "INSERT INTO company_memberships (user_id, company_id, category_id, can_cash_out) VALUES ($1, $2, $3, $4) RETURNING *", // Insert category_id
            [userId, companyId, categoryId, can_cash_out]
        );
        return result.rows[0];
    },

    async getMembershipsByUserId(userId) {
        const result = await pool.query(
            `SELECT
                cm.id as membership_id,
                cm.role,
                cm.category_id,
                c.name as category_name,
                c.is_tip_distribution_pool,
                cm.can_cash_out,
                comp.id as company_id,
                comp.name as company_name
             FROM company_memberships cm
             LEFT JOIN categories c ON cm.category_id = c.id
             JOIN companies comp ON cm.company_id = comp.id
             WHERE cm.user_id = $1`,
            [userId]
        );
        return result.rows;
    },
    
    async getMembershipById(membershipId) {
        const result = await pool.query(
            `SELECT
                cm.id,
                cm.user_id,
                cm.company_id,
                cm.category_id,
                c.name as category_name,
                c.is_tip_distribution_pool,
                cm.can_cash_out
             FROM company_memberships cm
             LEFT JOIN categories c ON cm.category_id = c.id
             WHERE cm.id = $1`,
            [membershipId]
        );
        return result.rows[0];
    },

    async deleteMembership(membershipId) {
        await pool.query("DELETE FROM company_memberships WHERE id = $1", [membershipId]);
    },

    async updateMembership(membershipId, { categoryId, can_cash_out }) { // Changed role to categoryId
        let query = 'UPDATE company_memberships SET';
        const values = [];
        let setClauses = [];

        if (categoryId !== undefined) { // Update category_id
            values.push(categoryId);
            setClauses.push(`category_id = $${values.length}`);
        }

        if (can_cash_out !== undefined) {
            values.push(can_cash_out);
            setClauses.push(`can_cash_out = $${values.length}`);
        }

        if (setClauses.length === 0) {
            return;
        }

        query += ` ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP`;
        values.push(membershipId);
        query += ` WHERE id = $${values.length}`;

        await pool.query(query, values);
    },

    async getCompanyEmployees(companyId) {
        const result = await pool.query(
            `SELECT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.created_at,
                cm.id as membership_id,
                cm.category_id,
                cat.name as category_name,
                cat.is_tip_distribution_pool,
                cm.can_cash_out
             FROM users u
             JOIN company_memberships cm ON u.id = cm.user_id
             LEFT JOIN categories cat ON cm.category_id = cat.id
             WHERE cm.company_id = $1
             ORDER BY u.email`,
            [companyId]
        );
        return result.rows;
    },
};

module.exports = { MembershipModel };
