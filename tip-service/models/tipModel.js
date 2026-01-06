const { pool } = require("../config/db");

const TipModel = {

    // --- Cash Out & Adjustment Methods ---
    async createCashOut(cashOutData, dailyReportId, adjustments) {
        const {
            user_id, company_id, category_id, service_date, // Changed role to category_id
            was_collector, total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance, cash_on_hand,
            payout_period_id
        } = cashOutData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const cashOutResult = await client.query(
                `INSERT INTO cash_outs (user_id, company_id, category_id, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, daily_report_id, cash_on_hand, payout_period_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
                [user_id, company_id, category_id, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, dailyReportId, cash_on_hand, payout_period_id]
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
                dr.category_id,
                dr.category_name,
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = co.daily_report_id),
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
                dr.category_id,
                dr.category_name,
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = co.daily_report_id),
                    '[]'
                ) as adjustments
             FROM cash_outs co
             JOIN daily_reports dr ON co.daily_report_id = dr.id
             WHERE co.id = $1`,
            [cashOutId]
        );
        return result.rows[0];
    },

    async getCashOutByDailyReportId(dailyReportId) {
        const result = await pool.query(
            `SELECT * FROM cash_outs WHERE daily_report_id = $1`,
            [dailyReportId]
        );
        return result.rows[0];
    },

    async getServerOverviewForCompany(companyId, startDate, endDate) {
        const params = [companyId];
        let query = `SELECT
                co.user_id as employee_id,
                dr.category_id,
                dr.category_name,
                co.service_date as date,
                co.gross_tips,
                co.net_tips,
                (co.gross_tips - co.net_tips) as adjustments
             FROM cash_outs co
             JOIN daily_reports dr ON co.daily_report_id = dr.id
             WHERE co.company_id = $1`;

        if (startDate && endDate) {
            query += ` AND co.service_date BETWEEN $2 AND $3`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY co.service_date DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async getCashOutsForCompany(companyId, startDate, endDate) {
        const params = [companyId];
        let query = `SELECT
                co.id,
                co.user_id,
                dr.category_id,
                dr.category_name,
                co.service_date as date,
                co.gross_tips as amount,
                co.net_tips,
                co.final_balance,
                co.payout_period_id,
                co.created_at,
                'Completed' as status, -- Assuming all fetched cash outs are completed. Adjust if status is stored.
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = co.daily_report_id),
                    '[]'
                ) as adjustments
             FROM cash_outs co
             JOIN daily_reports dr ON co.daily_report_id = dr.id
             WHERE co.company_id = $1`;

        if (startDate && endDate) {
            query += ` AND co.service_date BETWEEN $2 AND $3`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY co.service_date DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async updateCashOut(cashOutId, cashOutData, adjustments) {
        const {
            total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance, category_id // Added category_id
        } = cashOutData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updateCashOutResult = await client.query(
                `UPDATE cash_outs
                 SET total_sales = $1, gross_tips = $2, net_tips = $3, service_end_time = $4, food_sales = $5, alcohol_sales = $6, cash_difference = $7, final_balance = $8, category_id = $9, updated_at = NOW()
                 WHERE id = $10 RETURNING *`,
                [total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, category_id, cashOutId]
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
    async calculateTipOutsForPayPeriod(companyId, destinationCategoryId, startDate, endDate) { // Changed destinationRole to destinationCategoryId
        const result = await pool.query(
            `SELECT COALESCE(SUM(ra.amount), 0) as total_tip_out_amount
             FROM report_adjustments ra
             JOIN daily_reports dr ON ra.report_id = dr.id
             JOIN tip_out_rules tor ON ra.rule_id = tor.id
             WHERE dr.company_id = $1
               AND dr.service_date BETWEEN $2 AND $3
               AND ra.adjustment_type = 'TIP_OUT_AUTOMATIC'
               AND tor.destination_category_id = $4 -- Changed destination_role to destination_category_id
            `,
            [companyId, startDate, endDate, destinationCategoryId]
        );
        return Math.abs(result.rows[0].total_tip_out_amount);
    },

    // --- New method for billing service ---
    async getGrossTipsVolumeByCompanyAndPeriod(companyId, startDate, endDate) {
        const result = await pool.query(
            `SELECT COALESCE(SUM(gross_tips), 0) as total_gross_tips_volume
             FROM cash_outs
             WHERE company_id = $1 AND service_date BETWEEN $2 AND $3`,
            [companyId, startDate, endDate]
        );
        return parseFloat(result.rows[0].total_gross_tips_volume);
    },

    // --- Pool Management ---
    async createPool(companyId, categoryId, startDate, endDate, totalAmount, distributions) { // Changed role to categoryId
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const poolResult = await client.query(
                `INSERT INTO tip_pools (company_id, category_id, start_date, end_date, total_amount)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [companyId, categoryId, startDate, endDate, totalAmount]
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

        let query = `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, tp.created_at, cat.name as category_name, cat.is_tip_distribution_pool, -- Changed tp.role to cat.name
                           COUNT(pd.user_id) as recipient_count,
                           COALESCE(SUM(pd.hours_worked), 0) as total_distributed_hours
                     FROM tip_pools tp
                     LEFT JOIN pool_distributions pd ON tp.id = pd.pool_id
                     LEFT JOIN auth_service_db.public.categories cat ON tp.category_id = cat.id -- Join with auth_service categories
                     WHERE ${conditions.join(' AND ')}
                     GROUP BY tp.id, cat.name, cat.is_tip_distribution_pool
                     ORDER BY tp.start_date DESC, tp.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async getPoolDetailsById(poolId, companyId) {
        const poolResult = await pool.query(
            `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, cat.name as category_name, cat.is_tip_distribution_pool -- Changed tp.role to cat.name
             FROM tip_pools tp
             LEFT JOIN auth_service_db.public.categories cat ON tp.category_id = cat.id -- Join with auth_service categories
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

    async getReceivedTipsByEmployee(userId, companyId, startDate, endDate) {
        const params = [userId, companyId];
        let poolConditions = [`pd.user_id = $1`, `tp.company_id = $2`];
        let individualConditions = [`ra.related_user_id = $1`, `dr.company_id = $2`, `ra.amount > 0`];
        let paramIndex = 3;

        if (startDate) {
            poolConditions.push(`tp.start_date >= $${paramIndex}::DATE`);
            individualConditions.push(`dr.service_date >= $${paramIndex}::DATE`);
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            poolConditions.push(`tp.end_date <= $${paramIndex}::DATE`);
            individualConditions.push(`dr.service_date <= $${paramIndex}::DATE`);
            params.push(endDate);
            paramIndex++;
        }

        const poolQuery = `SELECT
                pd.distributed_amount,
                pd.hours_worked,
                tp.start_date,
                tp.end_date,
                tp.created_at as pool_created_at,
                cat.name as category_name, -- Changed tp.role as department_name to cat.name
                tp.id as pool_id,
                'pool' as source,
                NULL as sender_user_id
             FROM pool_distributions pd
             JOIN tip_pools tp ON pd.pool_id = tp.id
             LEFT JOIN auth_service_db.public.categories cat ON tp.category_id = cat.id -- Join with auth_service categories
             WHERE ${poolConditions.join(' AND ')}`;

        const individualQuery = `SELECT
                ra.amount as distributed_amount,
                NULL as hours_worked,
                dr.service_date as start_date,
                dr.service_date as end_date,
                ra.created_at as pool_created_at,
                dr.category_name, -- Changed ra.description as department_name to dr.category_name
                ra.id as pool_id,
                'individual' as source,
                dr.user_id as sender_user_id
             FROM report_adjustments ra
             JOIN daily_reports dr ON ra.report_id = dr.id
             WHERE ${individualConditions.join(' AND ')}`;

        const result = await pool.query(
            `${poolQuery} UNION ALL ${individualQuery} ORDER BY start_date DESC`,
            params
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

    async createDailyReport(userId, companyId, categoryId, serviceDate, was_collector) { // Changed role to categoryId
        const result = await pool.query(
            `INSERT INTO daily_reports (user_id, company_id, category_id, service_date, was_collector)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, companyId, categoryId, serviceDate, was_collector]
        );
        return result.rows[0];
    },
};

module.exports = { TipModel, pool };