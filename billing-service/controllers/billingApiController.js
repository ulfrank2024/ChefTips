const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');

const getPlans = async (req, res) => {
  try {
    const result = await query(`SELECT id, name, monthly_fee, transaction_fee_percent, default_trial_days FROM plans WHERE is_active = TRUE ORDER BY monthly_fee`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
};

const getSubscriptionStatus = async (req, res) => {
  const { companyId } = req.params;
  if (!companyId) {
    return res.status(400).json({ error: 'COMPANY_ID_REQUIRED' });
  }

  try {
    const result = await query(
      `SELECT s.status, s.trial_ends_at, s.current_period_ends_at, s.stripe_customer_id, p.name as plan_name, p.monthly_fee, p.transaction_fee_percent
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.company_id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
};

const createCheckoutSession = async (req, res) => {
  const { planId, companyId } = req.body;
  if (!planId || !companyId) {
    return res.status(400).json({ error: 'PLAN_ID_AND_COMPANY_ID_REQUIRED' });
  }

  try {
    const planResult = await query(`SELECT * FROM plans WHERE id = $1`, [planId]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'PLAN_NOT_FOUND' });
    }
    const plan = planResult.rows[0];

    const subscriptionResult = await query(`SELECT stripe_customer_id FROM subscriptions WHERE company_id = $1`, [companyId]);
    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'SUBSCRIPTION_NOT_FOUND_FOR_COMPANY' });
    }
    const customerId = subscriptionResult.rows[0].stripe_customer_id;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'cad', // Or your desired currency
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.monthly_fee, // Monthly fee in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
        // If you have metered billing for transaction fees, you'd add a separate price item here
      ],
      customer: customerId,
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`, // Redirect to billing page on success
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`, // Redirect to billing page on cancel
      subscription_data: {
        trial_period_days: plan.default_trial_days, // Use plan's trial days
        metadata: {
          company_id: companyId,
          plan_id: plan.id,
        },
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
  }
};

const createCustomerPortalSession = async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: 'CUSTOMER_ID_REQUIRED' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/billing`, // Return to billing page
    });
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
  }
};

module.exports = {
  getPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  createCustomerPortalSession,
};
