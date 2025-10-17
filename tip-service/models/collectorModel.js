const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const CollectorModel = {
    async getTipsByCollector(userId, companyId, startDate, endDate) {
        const result = await pool.query(
            `SELECT dr.*, c.name as category_name
             FROM daily_reports dr
             JOIN categories c ON dr.category_id = c.id
             WHERE dr.user_id = $1 AND dr.company_id = $2 AND dr.was_collector = TRUE AND dr.service_date BETWEEN $3 AND $4
             ORDER BY dr.service_date DESC`,
            [userId, companyId, startDate, endDate]
        );
        return result.rows;
    },

    // Placeholder for addTip/createCollectedTip
    async createCollectedTip(userId, companyId, categoryId, serviceDate, grossTips, paymentMethod, source) {
        const result = await pool.query(
            `INSERT INTO daily_reports (user_id, company_id, category_id, service_date, was_collector, total_sales, gross_tips, net_tips, payment_method, source)
             VALUES ($1, $2, $3, $4, TRUE, 0, $5, $5, $6, $7) RETURNING *`,
            [userId, companyId, categoryId, serviceDate, grossTips, paymentMethod, source]
        );
        return result.rows[0];
    }
};

module.exports = { CollectorModel };
