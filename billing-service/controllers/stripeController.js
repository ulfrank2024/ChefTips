const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');
const { suspendCompany, reactivateCompany } = require('../services/authService'); // Import authService functions

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription ${subscription.id} status is ${subscription.status}.`);
      // Update your database with the subscription status
      await query(
        `UPDATE subscriptions SET stripe_subscription_id = $1, status = $2, current_period_ends_at = TO_TIMESTAMP($3), updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $4`,
        [subscription.id, subscription.status, subscription.current_period_end, subscription.customer]
      );
      // If subscription becomes active, reactivate the company
      if (subscription.status === 'active') {
        const companyResult = await query(`SELECT company_id FROM subscriptions WHERE stripe_customer_id = $1`, [subscription.customer]);
        if (companyResult.rows.length > 0) {
          await reactivateCompany(companyResult.rows[0].company_id);
        }
      }
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log(`Subscription ${deletedSubscription.id} was deleted.`);
      // Update your database with the subscription status
      await query(
        `UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = $2`,
        ['canceled', deletedSubscription.id]
      );
      // Suspend the company
      const companyResultDeleted = await query(`SELECT company_id FROM subscriptions WHERE stripe_customer_id = $1`, [deletedSubscription.customer]);
      if (companyResultDeleted.rows.length > 0) {
        await suspendCompany(companyResultDeleted.rows[0].company_id);
      }
      break;
    case 'invoice.payment_succeeded':
      const invoiceSucceeded = event.data.object;
      console.log(`Payment succeeded for invoice ${invoiceSucceeded.id}.`);
      // Optionally, update subscription status or log payment
      break;
    case 'invoice.payment_failed':
      const invoiceFailed = event.data.object;
      console.log(`Payment failed for invoice ${invoiceFailed.id}.`);
      // Update your database with the subscription status (e.g., 'past_due')
      await query(
        `UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $2`,
        ['past_due', invoiceFailed.customer]
      );
      // If payment failed and subscription is now canceled or unpaid, suspend the company
      const subscriptionAfterFailure = await stripe.subscriptions.retrieve(invoiceFailed.subscription);
      if (subscriptionAfterFailure && (subscriptionAfterFailure.status === 'canceled' || subscriptionAfterFailure.status === 'unpaid')) {
        const companyResultFailed = await query(`SELECT company_id FROM subscriptions WHERE stripe_customer_id = $1`, [invoiceFailed.customer]);
        if (companyResultFailed.rows.length > 0) {
          await suspendCompany(companyResultFailed.rows[0].company_id);
        }
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  handleWebhook,
};
