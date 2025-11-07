const { pool } = require("../config/db");

const PayoutPeriodModel = {
    _getPeriodStatus(period) {
        const today = new Date();
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);

        // Normalize dates to start of day for accurate comparison
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (today < startDate) {
            return 'FUTURE';
        } else if (today > endDate) {
            return 'PAST';
        } else {
            return 'CURRENT';
        }
    },

    async create(companyId, name, startDate, endDate) {
        const result = await pool.query(
            `INSERT INTO payout_periods (company_id, name, start_date, end_date)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [companyId, name, startDate, endDate]
        );
        return result.rows[0];
    },

    async findByCompanyId(companyId) {
        const result = await pool.query(
            `SELECT * FROM payout_periods WHERE company_id = $1 ORDER BY start_date DESC`,
            [companyId]
        );
        return result.rows.map(period => ({
            ...period,
            status: this._getPeriodStatus(period)
        }));
    },

    async update(id, companyId, name, startDate, endDate) {
        const result = await pool.query(
            `UPDATE payout_periods SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 AND company_id = $5 RETURNING *`,
            [name, startDate, endDate, id, companyId]
        );
        return result.rows[0];
    },

    async delete(id, companyId) {
        const result = await pool.query(
            `DELETE FROM payout_periods WHERE id = $1 AND company_id = $2`,
            [id, companyId]
        );
        return result.rowCount > 0;
    },

    async findActiveByCompany(companyId) {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        console.log("findActiveByCompany: companyId=", companyId, "today=", formattedToday);
        const result = await pool.query(
            `SELECT * FROM payout_periods
             WHERE company_id = $1
             AND start_date <= $2::DATE AND end_date >= $2::DATE
             LIMIT 1`,
            [companyId, formattedToday]
        );
        const period = result.rows[0];
        if (period) {
            const periodWithStatus = { ...period, status: this._getPeriodStatus(period) };
            console.log("findActiveByCompany: query result:", periodWithStatus);
            return periodWithStatus;
        }
        console.log("findActiveByCompany: query result: undefined");
        return undefined;
    },
};

module.exports = { PayoutPeriodModel };