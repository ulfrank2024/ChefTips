const { pool } = require("../config/db");

const PayoutPeriodModel = {
    /**
     * Creates a new payout period for a company.
     * @param {object} periodData - The data for the new period.
     * @param {string} periodData.company_id - The ID of the company.
     * @param {string} periodData.name - The name of the period.
     * @param {string} periodData.start_date - The start date of the period (YYYY-MM-DD).
     * @param {string} periodData.end_date - The end date of the period (YYYY-MM-DD).
     * @returns {Promise<object>} The newly created payout period object.
     */
    async create({ company_id, name, start_date, end_date }) {
        const result = await pool.query(
            `INSERT INTO payout_periods (company_id, name, start_date, end_date, status)
             VALUES ($1, $2, $3, $4, 'OPEN') RETURNING *`,
            [company_id, name, start_date, end_date]
        );
        return result.rows[0];
    },

    /**
     * Finds a payout period by its ID.
     * @param {string} periodId - The ID of the payout period.
     * @returns {Promise<object|null>} The payout period object or null if not found.
     */
    async findById(periodId) {
        const result = await pool.query(
            'SELECT * FROM payout_periods WHERE id = $1',
            [periodId]
        );
        return result.rows[0];
    },

    /**
     * Finds all payout periods for a given company, ordered by start date descending.
     * @param {string} companyId - The ID of the company.
     * @returns {Promise<Array<object>>} A list of payout period objects.
     */
    async findByCompany(companyId) {
        const result = await pool.query(
            'SELECT * FROM payout_periods WHERE company_id = $1 ORDER BY start_date DESC',
            [companyId]
        );
        return result.rows;
    },

    /**
     * Finds the currently active (status = 'OPEN') payout period for a company.
     * Assumes there can be only one open period at a time.
     * @param {string} companyId - The ID of the company.
     * @returns {Promise<object|null>} The active payout period or null if none exists.
     */
    async findActiveByCompany(companyId) {
        const result = await pool.query(
            "SELECT * FROM payout_periods WHERE company_id = $1 AND status = 'OPEN' ORDER BY start_date DESC LIMIT 1",
            [companyId]
        );
        return result.rows[0];
    },

    /**
     * Updates a payout period.
     * @param {string} periodId - The ID of the period to update.
     * @param {object} updates - An object containing the fields to update (e.g., { name, status }).
     * @returns {Promise<object|null>} The updated payout period object or null if not found.
     */
    async update(periodId, updates) {
        const setClauses = [];
        const values = [];
        let i = 1;

        for (const key in updates) {
            if (updates[key] !== undefined) {
                setClauses.push(`${key} = $${i++}`);
                values.push(updates[key]);
            }
        }

        if (setClauses.length === 0) {
            return this.findById(periodId); // Return current state if no updates
        }

        values.push(periodId);
        const query = `UPDATE payout_periods SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    /**
     * Deletes a payout period by its ID.
     * @param {string} periodId - The ID of the period to delete.
     * @returns {Promise<boolean>} True if a row was deleted, false otherwise.
     */
    async delete(periodId) {
        const result = await pool.query(
            'DELETE FROM payout_periods WHERE id = $1',
            [periodId]
        );
        return result.rowCount > 0;
    }
};

module.exports = { PayoutPeriodModel };
