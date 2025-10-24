const { pool } = require("../config/db");

const RuleModel = {
    async createTipOutRule(ruleData) {
        const {
            company_id, name, destination_role = null,
            calculation_basis, percentage = null, flat_amount = null, distribution_type = 'DEPARTMENT_POOL',
            individual_recipient_roles = []
        } = ruleData;
        const result = await pool.query(
            `INSERT INTO tip_out_rules (company_id, name, destination_role, calculation_basis, percentage, flat_amount, distribution_type, individual_recipient_roles)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) RETURNING *`,
            [company_id, name, destination_role, calculation_basis, percentage, flat_amount, distribution_type, JSON.stringify(individual_recipient_roles)]
        );
        return result.rows[0];
    },

    async getTipOutRulesByCompany(companyId) {
        const result = await pool.query('SELECT *, distribution_type FROM tip_out_rules WHERE company_id = $1 ORDER BY name', [companyId]);
        return result.rows;
    },

    async updateTipOutRule(ruleId, updates) {
        const setClauses = [];
        const values = [];
        let i = 1;
        for (const key in updates) {
            // Ensure individual_recipient_roles is handled as JSONB
            if (key === 'individual_recipient_roles') {
                setClauses.push(`${key} = $${i++}::jsonb`);
                values.push(JSON.stringify(updates[key]));
            } else if (updates[key] !== undefined) {
                setClauses.push(`${key} = $${i++}`);
                values.push(updates[key]);
            }
        }
        if (setClauses.length === 0) return null;

        values.push(ruleId);
        const query = `UPDATE tip_out_rules SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async deleteTipOutRule(ruleId) {
        await pool.query('DELETE FROM tip_out_rules WHERE id = $1', [ruleId]);
    },
};

module.exports = { RuleModel };