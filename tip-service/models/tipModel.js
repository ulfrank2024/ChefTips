const { pool } = require("../config/db");

const TipModel = {

    // --- Tip Out Rule Methods ---
    async createTipOutRule(ruleData) {
        const {
            company_id, name, source_category_id = null, destination_department_id,
            calculation_basis, percentage = null, flat_amount = null, distribution_type = 'DEPARTMENT_POOL'
        } = ruleData;
        const result = await pool.query(
            `INSERT INTO tip_out_rules (company_id, name, source_category_id, destination_department_id, calculation_basis, percentage, flat_amount, distribution_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [company_id, name, source_category_id, destination_department_id, calculation_basis, percentage, flat_amount, distribution_type]
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
            if (updates[key] !== undefined) {
                setClauses.push(`${key} = ${i++}`);
                values.push(updates[key]);
            }
        }
        if (setClauses.length === 0) return null;

        values.push(ruleId);
        const query = `UPDATE tip_out_rules SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ${i} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async deleteTipOutRule(ruleId) {
        await pool.query('DELETE FROM tip_out_rules WHERE id = $1', [ruleId]);
    },

    // --- Daily Report & Adjustment Methods ---
    async createDailyReport(reportData, adjustments) {
        const {
            user_id, company_id, category_id, service_date,
            was_collector, total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance
        } = reportData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const reportResult = await client.query(
                `INSERT INTO daily_reports (user_id, company_id, category_id, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                [user_id, company_id, category_id, service_date, was_collector, total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance]
            );
            const newReport = reportResult.rows[0];

            const insertedAdjustments = [];
            if (adjustments && adjustments.length > 0) {
                for (const adj of adjustments) {
                    const { adjustment_type, amount, description, related_user_id = null, rule_id = null } = adj;
                    const adjResult = await client.query(
                        `INSERT INTO report_adjustments (report_id, adjustment_type, amount, description, related_user_id, rule_id)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                        [newReport.id, adjustment_type, amount, description, related_user_id, rule_id]
                    );
                    insertedAdjustments.push(adjResult.rows[0]);
                }
            }

            await client.query('COMMIT');
            return { ...newReport, adjustments: insertedAdjustments };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getDailyReportsForUser(userId, companyId, startDate, endDate) {
        const result = await pool.query(
            `SELECT
                dr.*,
                c.name as category_name,
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = dr.id),
                    '[]'
                ) as adjustments
             FROM daily_reports dr
             JOIN categories c ON dr.category_id = c.id
             WHERE dr.user_id = $1 AND dr.company_id = $2 AND dr.service_date BETWEEN $3 AND $4
             ORDER BY dr.service_date DESC`,
            [userId, companyId, startDate, endDate]
        );
        return result.rows;
    },

    async getDailyReportById(reportId) {
        const result = await pool.query(
            `SELECT
                dr.*,
                c.name as category_name,
                COALESCE(
                    (SELECT json_agg(ra.*) FROM report_adjustments ra WHERE ra.report_id = dr.id),
                    '[]'
                ) as adjustments
             FROM daily_reports dr
             JOIN categories c ON dr.category_id = c.id
             WHERE dr.id = $1`,
            [reportId]
        );
        return result.rows[0];
    },

    async updateDailyReport(reportId, reportData, adjustments) {
        const {
            total_sales, gross_tips, net_tips, service_end_time,
            food_sales, alcohol_sales, cash_difference, final_balance
        } = reportData;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update the daily_reports entry
            const updateReportResult = await client.query(
                `UPDATE daily_reports
                 SET total_sales = $1, gross_tips = $2, net_tips = $3, service_end_time = $4, food_sales = $5, alcohol_sales = $6, cash_difference = $7, final_balance = $8, updated_at = NOW()
                 WHERE id = $9 RETURNING *`,
                [total_sales, gross_tips, net_tips, service_end_time, food_sales, alcohol_sales, cash_difference, final_balance, reportId]
            );
            const updatedReport = updateReportResult.rows[0];

            // 2. Delete existing manual adjustments for this report
            await client.query(
                `DELETE FROM report_adjustments WHERE report_id = $1 AND adjustment_type = 'MANUAL'`,
                [reportId]
            );

            // 3. Insert new manual adjustments
            const insertedAdjustments = [];
            if (adjustments && adjustments.length > 0) {
                for (const adj of adjustments) {
                    const { adjustment_type, amount, description, related_user_id = null, rule_id = null } = adj;
                    const adjResult = await client.query(
                        `INSERT INTO report_adjustments (report_id, adjustment_type, amount, description, related_user_id, rule_id)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                        [reportId, adjustment_type, amount, description, related_user_id, rule_id]
                    );
                    insertedAdjustments.push(adjResult.rows[0]);
                }
            }

            await client.query('COMMIT');
            return { ...updatedReport, adjustments: insertedAdjustments };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // --- Calculation/Read Methods for Reporting ---

    /**
     * Calculates the total amount of tip-outs owed to a specific "Back of House" category
     * over a given pay period. This is the core of the "Pay Period Pool" logic.
     */
    async calculateTipOutsForPayPeriod(companyId, destinationDepartmentId, startDate, endDate) {
        const result = await pool.query(
            `SELECT COALESCE(SUM(ra.amount), 0) as total_tip_out_amount
             FROM report_adjustments ra
             JOIN daily_reports dr ON ra.report_id = dr.id
             JOIN tip_out_rules tor ON ra.rule_id = tor.id
             WHERE dr.company_id = $1 
               AND dr.service_date BETWEEN $2 AND $3
               AND ra.adjustment_type = 'TIP_OUT_AUTOMATIC'
               AND tor.destination_department_id = $4
            `,
            [companyId, startDate, endDate, destinationDepartmentId]
        );
        return Math.abs(result.rows[0].total_tip_out_amount);
    },

    // --- Pool Management ---
    async createPool(companyId, departmentId, startDate, endDate, totalAmount, distributions) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const poolResult = await client.query(
                `INSERT INTO tip_pools (company_id, department_id, start_date, end_date, total_amount)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [companyId, departmentId, startDate, endDate, totalAmount]
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

    // --- Pool History and Details ---
    async getPoolsByCompany(companyId, filterStartDate, filterEndDate, poolId = null) {
        const params = [companyId];
        let conditions = [`tp.company_id = $1`];
        let paramIndex = 2;

        if (filterStartDate && filterStartDate !== 'null') {
            conditions.push(`tp.start_date >= ${paramIndex++}::DATE`);
            params.push(filterStartDate);
        }
        if (filterEndDate && filterEndDate !== 'null') {
            conditions.push(`tp.end_date <= ${paramIndex++}::DATE`);
            params.push(filterEndDate);
        }
        if (poolId) {
            conditions.push(`tp.id = ${paramIndex++}::uuid`); // Explicitly cast to uuid
            params.push(poolId);
        }

        let query = `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, tp.created_at, d.name as department_name,
                           COUNT(pd.user_id) as recipient_count,
                           COALESCE(SUM(pd.hours_worked), 0) as total_distributed_hours
                     FROM tip_pools tp
                     JOIN departments d ON tp.department_id = d.id
                     LEFT JOIN pool_distributions pd ON tp.id = pd.pool_id
                     WHERE ${conditions.join(' AND ')}
                     GROUP BY tp.id, d.name
                     ORDER BY tp.start_date DESC, tp.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async getPoolDetailsById(poolId, companyId) {
        const poolResult = await pool.query(
            `SELECT tp.id, tp.start_date, tp.end_date, tp.total_amount, d.name as department_name
             FROM tip_pools tp
             JOIN departments d ON tp.department_id = d.id
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

        // Calculate recipient_count and total_distributed_hours
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
                d.name as department_name,
                tp.id as pool_id
             FROM pool_distributions pd
             JOIN tip_pools tp ON pd.pool_id = tp.id
             JOIN departments d ON tp.department_id = d.id
             WHERE pd.user_id = $1 AND tp.company_id = $2
             ORDER BY tp.start_date DESC`,
            [userId, companyId]
        );
        return result.rows;
    },
};

module.exports = { TipModel, pool };
