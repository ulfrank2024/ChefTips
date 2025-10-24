const { pool } = require("../config/db");

const TipModel = {

    // --- Cash Out & Adjustment Methods ---
    async createCashOut(cashOutData, dailyReportId, adjustments) {
        const {
            user_id, company_id, role, service_date, // Changed category_id to role
            was_collector, total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance
        } = cashOutData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const cashOutResult = await client.query(
                `INSERT INTO cash_outs (user_id, company_id, role, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, daily_report_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
                [user_id, company_id, role, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, dailyReportId]
            );
            const newCashOut = cashOutResult.rows[0];

            const insertedAdjustments = [];
            if (adjustments && adjustments.length > 0) {
                for (const adj of adjustments) {
                    const { adjustment_type, amount, description, related_user_id = null, rule_id = null } = adj;
                    const adjResult = await client.query(
                        `INSERT INTO report_adjustments (report_id, adjustment_type, amount, description, related_user_id, rule_id)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                        [dailyReportId, adjustment_type, amount, description, related_user_id, rule_id]
                    );
                    insertedAdjustments.push(adjResult.rows[0]);
                }
            }

            await client.query('COMMIT');
            return { ...newCashOut, adjustments: insertedAdjustments };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getCashOutsForUser(userId, companyId, startDate, endDate) {
        const result = await pool.query(
            `SELECT
                co.*,
                dr.role as category_name,
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = co.id),
                    '[]'
                ) as adjustments
             FROM cash_outs co
             JOIN daily_reports dr ON co.daily_report_id = dr.id
             WHERE co.user_id = $1 AND co.company_id = $2 AND co.service_date BETWEEN $3 AND $4
             ORDER BY co.service_date DESC`,
            [userId, companyId, startDate, endDate]
        );
        return result.rows;
    },

    async getCashOutById(cashOutId) {
        const result = await pool.query(
            `SELECT
                co.*,
                co.role as category_name, // Use role and alias as category_name for compatibility
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = co.id),
                    '[]'
                ) as adjustments
             FROM cash_outs co
             WHERE co.id = $1`,
            [cashOutId]
        );
        return result.rows[0];
    },

    async updateCashOut(cashOutId, cashOutData, adjustments) {
        const {
            total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance
        } = cashOutData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updateCashOutResult = await client.query(
                `UPDATE cash_outs
                 SET total_sales = $1, gross_tips = $2, net_tips = $3, service_end_time = $4, food_sales = $5, alcohol_sales = $6, cash_difference = $7, final_balance = $8, updated_at = NOW()
                 WHERE id = $9 RETURNING *`,
                [total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, cashOutId]
            );
            const updatedCashOut = updateCashOutResult.rows[0];

            await client.query(
                `DELETE FROM report_adjustments WHERE report_id = $1 AND adjustment_type = 'MANUAL'`,
                [cashOutId]
            );

            const insertedAdjustments = [];
            if (adjustments && adjustments.length > 0) {
                for (const adj of adjustments) {
                    const { adjustment_type, amount, description, related_user_id = null, rule_id = null } = adj;
                    const adjResult = await client.query(
                        `INSERT INTO report_adjustments (report_id, adjustment_type, amount, description, related_user_id, rule_id)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                        [cashOutId, adjustment_type, amount, description, related_user_id, rule_id]
                    );
                    insertedAdjustments.push(adjResult.rows[0]);
                }
            }

            await client.query('COMMIT');
            return { ...updatedCashOut, adjustments: insertedAdjustments };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // --- Calculation/Read Methods for Reporting ---
    async calculateTipOutsForPayPeriod(companyId, destinationRole, startDate, endDate) {
        const result = await pool.query(
            `SELECT COALESCE(SUM(ra.amount), 0) as total_tip_out_amount
             FROM report_adjustments ra
             JOIN daily_reports dr ON ra.report_id = dr.id
             JOIN tip_out_rules tor ON ra.rule_id = tor.id
             WHERE dr.company_id = $1 
               AND dr.service_date BETWEEN $2 AND $3
               AND ra.adjustment_type = 'TIP_OUT_AUTOMATIC'
               AND tor.destination_role = $4
            `,
            [companyId, startDate, endDate, destinationRole]
        );
        return Math.abs(result.rows[0].total_tip_out_amount);
    },

    // --- Pool Management ---
    async createPool(companyId, role, startDate, endDate, totalAmount, distributions) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const poolResult = await client.query(
                `INSERT INTO tip_pools (company_id, role, start_date, end_date, total_amount)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [companyId, role, startDate, endDate, totalAmount]
            );
            const newPool = poolResult.rows[0];

            for (const dist of distributions) {
                await client.query(
                    `INSERT INTO pool_distributions (pool_id, user_id, hours_worked, distributed_amount)
                     VALUES ($1, $2, $3, $4)`,
                    [newPool.id, dist.user_id, dist.hours_worked, dist.distributed_amount]
                );
            }

            await client.query('COMMIT');
            return newPool;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getPoolsByCompany(companyId, filterStartDate, filterEndDate, poolId = null) {
        const params = [companyId];
        let conditions = [`tp.company_id = $1`];
        let paramIndex = 2;

        if (filterStartDate && filterStartDate !== 'null') {
            conditions.push(`tp.start_date >= $${paramIndex++}::DATE`);
            params.push(filterStartDate);
        }
        if (filterEndDate && filterEndDate !== 'null') {
            conditions.push(`tp.end_date <= $${paramIndex++}::DATE`);
            params.push(filterEndDate);
        }
        if (poolId) {
            conditions.push(`tp.id = $${paramIndex++}::uuid`);
            params.push(poolId);
        }

        let query = `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, tp.created_at, tp.role as department_name,
                           COUNT(pd.user_id) as recipient_count,
                           COALESCE(SUM(pd.hours_worked), 0) as total_distributed_hours
                     FROM tip_pools tp
                     LEFT JOIN pool_distributions pd ON tp.id = pd.pool_id
                     WHERE ${conditions.join(' AND ')}
                     GROUP BY tp.id, tp.role
                     ORDER BY tp.start_date DESC, tp.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async getPoolDetailsById(poolId, companyId) {
        const poolResult = await pool.query(
            `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, tp.role as department_name
             FROM tip_pools tp
             WHERE tp.id = $1 AND tp.company_id = $2`,
            [poolId, companyId]
        );

        if (poolResult.rows.length === 0) {
            return null;
        }

        const distributionsResult = await pool.query(
            `SELECT user_id, hours_worked, distributed_amount 
             FROM pool_distributions 
             WHERE pool_id = $1 
             ORDER BY distributed_amount DESC`,
            [poolId]
        );

        const poolDetails = poolResult.rows[0];
        poolDetails.distributions = distributionsResult.rows;

        poolDetails.recipient_count = distributionsResult.rows.length;
        poolDetails.total_distributed_hours = distributionsResult.rows.reduce((sum, dist) => sum + Number(dist.hours_worked), 0);

        return poolDetails;
    },

    async getReceivedTipsByEmployee(userId, companyId) {
        const result = await pool.query(
            `SELECT
                pd.distributed_amount,
                pd.hours_worked,
                tp.start_date,
                tp.end_date,
                tp.created_at as pool_created_at,
                tp.role as department_name,
                tp.id as pool_id
             FROM pool_distributions pd
             JOIN tip_pools tp ON pd.pool_id = tp.id
             WHERE pd.user_id = $1 AND tp.company_id = $2
             ORDER BY tp.start_date DESC`,
            [userId, companyId]
        );
        return result.rows;
    },

    // --- Daily Report Methods ---
    async getDailyReport(userId, companyId, serviceDate) {
        const result = await pool.query(
            `SELECT * FROM daily_reports
             WHERE user_id = $1 AND company_id = $2 AND service_date = $3`,
            [userId, companyId, serviceDate]
        );
        return result.rows[0];
    },

    async createDailyReport(userId, companyId, role, serviceDate, was_collector) { // Changed categoryId to role
        const result = await pool.query(
            `INSERT INTO daily_reports (user_id, company_id, role, service_date, was_collector)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, companyId, role, serviceDate, was_collector]
        );
        return result.rows[0];
    },
};

module.exports = { TipModel, pool };