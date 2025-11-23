const db = require('../config/db');

const getKpis = async (req, res) => {
  try {
    const [mrr, activeCustomers, trialCustomers] = await Promise.all([
      db.query(`
        SELECT COALESCE(SUM(p.monthly_fee), 0) / 100 AS mrr
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
      `),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing'"),
    ]);

    res.json({
      mrr: parseFloat(mrr.rows[0].mrr),
      activeCustomers: parseInt(activeCustomers.rows[0].count, 10),
      trialCustomers: parseInt(trialCustomers.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getHistoricalKpis = async (req, res) => {
  try {
    // La requête SQL ci-dessous agrège les données par mois.
    // Elle sélectionne le MRR, les clients actifs et les clients en essai pour chaque mois.
    // Les CTEs (Common Table Expressions) sont utilisées pour organiser les requêtes.
    // COALESCE est utilisé pour s'assurer que les valeurs sont 0 si aucune donnée n'est trouvée pour un mois donné.
    const historicalData = await db.query(`
        WITH monthly_mrr AS (
            SELECT
                TO_CHAR(DATE_TRUNC('month', s.created_at), 'YYYY-MM-DD') AS month,
                COALESCE(SUM(p.monthly_fee), 0) AS mrr_value
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            GROUP BY month
        ),
        monthly_active_customers AS (
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM-DD') AS month,
                COUNT(id) AS active_customers_count
            FROM subscriptions
            WHERE status = 'active'
            GROUP BY month
        ),
        monthly_trial_customers AS (
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM-DD') AS month,
                COUNT(id) AS trial_customers_count
            FROM subscriptions
            WHERE status = 'trialing'
            GROUP BY month
        )
        SELECT
            COALESCE(m_m.month, m_a.month, m_t.month) AS date,
            COALESCE(m_m.mrr_value / 100, 0) AS mrr,
            COALESCE(m_a.active_customers_count, 0) AS activeCustomers,
            COALESCE(m_t.trial_customers_count, 0) AS trialCustomers
        FROM monthly_mrr m_m
        FULL JOIN monthly_active_customers m_a ON m_m.month = m_a.month
        FULL JOIN monthly_trial_customers m_t ON COALESCE(m_m.month, m_a.month) = m_t.month
        ORDER BY date ASC
    `);

    res.json(historicalData.rows);
  } catch (error) {
    console.error('Error fetching historical KPIs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createPlan = async (req, res) => {
  const { name, monthly_fee, transaction_fee_percent, default_trial_days } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO plans (name, monthly_fee, transaction_fee_percent, default_trial_days) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, monthly_fee, transaction_fee_percent, default_trial_days]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPlans = async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM plans ORDER BY id`);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPlanById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`SELECT * FROM plans WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching plan by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, monthly_fee, transaction_fee_percent, default_trial_days, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE plans SET name = $1, monthly_fee = $2, transaction_fee_percent = $3, default_trial_days = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [name, monthly_fee, transaction_fee_percent, default_trial_days, is_active, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deactivatePlan = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `UPDATE plans SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error deactivating plan:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getDefaultTrialDays = async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT setting_value, created_at, updated_at FROM app_settings WHERE setting_name = 'default_trial_days'`);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'DEFAULT_TRIAL_DAYS_NOT_FOUND' });
    }
    res.status(200).json({ 
      default_trial_days: parseInt(rows[0].setting_value, 10),
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    });
  } catch (error) {
    console.error('Error fetching default trial days:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateDefaultTrialDays = async (req, res) => {
  const { default_trial_days } = req.body;
  if (typeof default_trial_days !== 'number' || default_trial_days < 0) {
    return res.status(400).json({ error: 'INVALID_DEFAULT_TRIAL_DAYS' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO app_settings (setting_name, setting_value) VALUES ('default_trial_days', $1)
       ON CONFLICT (setting_name) DO UPDATE SET setting_value = $1, updated_at = CURRENT_TIMESTAMP RETURNING *`,
      [default_trial_days.toString()]
    );
    res.status(200).json({ message: 'Default trial days updated successfully', setting: rows[0] });
  } catch (error) {
    console.error('Error updating default trial days:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getKpis,
  getHistoricalKpis,
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deactivatePlan,
  getDefaultTrialDays,
  updateDefaultTrialDays,
};