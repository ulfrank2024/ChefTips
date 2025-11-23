const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');

const createTrialSubscription = async (req, res) => {
  const { companyId, companyName, managerEmail } = req.body;
  console.log("createTrialSubscription: Received request body:", { companyId, companyName, managerEmail });

  if (!companyId || !companyName || !managerEmail) {
    console.error("createTrialSubscription: Missing required fields.");
    return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
  }

  try {
    // 1. Create a Stripe Customer
    console.log("createTrialSubscription: Creating Stripe customer...");
    const customer = await stripe.customers.create({
      email: managerEmail,
      name: companyName,
      metadata: {
        company_id: companyId,
      },
    });
    console.log("createTrialSubscription: Stripe customer created:", customer.id);

    // 2. Get the default trial plan (assuming one exists and is marked as default or has a specific ID)
    console.log("createTrialSubscription: Querying for default plan...");
    const defaultPlanResult = await query(
      `SELECT id, default_trial_days FROM plans WHERE is_active = TRUE ORDER BY id LIMIT 1` // TODO: Make this configurable to select a specific default plan
    );
    console.log("createTrialSubscription: Default plan query result rows:", defaultPlanResult.rows.length);

    if (defaultPlanResult.rows.length === 0) {
      console.error("createTrialSubscription: No default plan found.");
      return res.status(500).json({ error: "NO_DEFAULT_PLAN_FOUND", message: "No default billing plan configured." });
    }
    const defaultPlan = defaultPlanResult.rows[0];
    console.log("createTrialSubscription: Default plan found:", defaultPlan);

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + defaultPlan.default_trial_days);
    console.log("createTrialSubscription: Trial ends at:", trialEndsAt);

    // 3. Create a subscription entry in our database
    console.log("createTrialSubscription: Inserting subscription into database...");
    const subscriptionResult = await query(
      `INSERT INTO subscriptions (company_id, plan_id, stripe_customer_id, status, trial_ends_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, defaultPlan.id, customer.id, 'trialing', trialEndsAt]
    );
    console.log("createTrialSubscription: Subscription inserted:", subscriptionResult.rows[0].id);

    res.status(201).json({
      message: "Trial subscription created successfully",
      subscription: subscriptionResult.rows[0],
      stripeCustomer: customer,
    });
    console.log("createTrialSubscription: Trial subscription created successfully for companyId:", companyId);

  } catch (error) {
    console.error("Error creating trial subscription:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", details: error.message, fullError: error });
  }
};

const getAllSubscriptions = async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM subscriptions');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getSubscriptionByCompanyId = async (req, res) => {
  const { companyId } = req.params;
  try {
    const { rows } = await query('SELECT * FROM subscriptions WHERE company_id = $1', [companyId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "SUBSCRIPTION_NOT_FOUND" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching subscription by company ID:', error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  const { subscriptionId } = req.params;
  const { planId } = req.body;

  if (!subscriptionId || !planId) {
    return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
  }

  try {
    const { rows } = await query(
      `UPDATE subscriptions SET plan_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [planId, subscriptionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "SUBSCRIPTION_NOT_FOUND" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

const updateTrialEndDate = async (req, res) => {
  const { subscriptionId } = req.params;
  const { trialEndsAt } = req.body;

  if (!subscriptionId || !trialEndsAt) {
    return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
  }

  try {
    const { rows } = await query(
      `UPDATE subscriptions SET trial_ends_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [trialEndsAt, subscriptionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "SUBSCRIPTION_NOT_FOUND" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating trial end date:', error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

module.exports = {
  createTrialSubscription,
  getAllSubscriptions,
  getSubscriptionByCompanyId,
  updateSubscriptionPlan,
  updateTrialEndDate,
};
