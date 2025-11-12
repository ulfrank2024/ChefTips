const pool = require('../db');

const MembershipModel = {
    async createMembership(userId, companyId, role, can_cash_out = false) {
        const result = await pool.query(
            "INSERT INTO company_memberships (user_id, company_id, role, can_cash_out) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, companyId, role, can_cash_out]
        );
        return result.rows[0];
    },

    async getMembershipsByUserId(userId) {
        const result = await pool.query(
            `SELECT
                cm.id as membership_id,
                cm.role,
                cm.can_cash_out,
                c.id as company_id,
                c.name as company_name
             FROM company_memberships cm
             JOIN companies c ON cm.company_id = c.id
             WHERE cm.user_id = $1`,
            [userId]
        );
        return result.rows;
    },
    
    async getMembershipById(membershipId) {
        const result = await pool.query("SELECT * FROM company_memberships WHERE id = $1", [membershipId]);
        return result.rows[0];
    },

    async deleteMembership(membershipId) {
        await pool.query("DELETE FROM company_memberships WHERE id = $1", [membershipId]);
    },

    async updateMembership(membershipId, { role, can_cash_out }) {
        let query = 'UPDATE company_memberships SET';
        const values = [];
        let setClauses = [];

        if (role !== undefined) {
            values.push(role);
            setClauses.push(`role = $${values.length}`);
        }

        if (can_cash_out !== undefined) {
            values.push(can_cash_out);
            setClauses.push(`can_cash_out = $${values.length}`);
        }

        if (setClauses.length === 0) {
            return;
        }

        query += ` ${setClauses.join(', ')}`;
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
                cm.role,
                cm.can_cash_out
             FROM users u
             JOIN company_memberships cm ON u.id = cm.user_id
             WHERE cm.company_id = $1
             ORDER BY u.email`,
            [companyId]
        );
        return result.rows;
    },
};

module.exports = { MembershipModel };
