const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');
const { getGrossTipsVolume } = require('../services/tipService');

const runMonthlyBilling = async () => {
  console.log('Running monthly billing job...');
  const today = new Date();
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const startDate = firstDayOfLastMonth.toISOString().split('T')[0];
  const endDate = lastDayOfLastMonth.toISOString().split('T')[0];

  try {
    const activeSubscriptions = await query(
      `SELECT s.company_id, s.stripe_customer_id, s.stripe_subscription_id, p.transaction_fee_percent
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.status = 'active'`
    );

    for (const sub of activeSubscriptions.rows) {
      console.log(`Processing subscription for company ${sub.company_id}...`);
      if (sub.transaction_fee_percent > 0) {
        const grossTipsVolume = await getGrossTipsVolume(sub.company_id, startDate, endDate);
        const transactionFee = grossTipsVolume * (sub.transaction_fee_percent / 100);

        // Report usage to Stripe for metered billing
        // This assumes you have a metered usage item in your Stripe product/price
        // You would need to create a Price with a usage-based pricing model in Stripe
        // For simplicity, we'll assume a single usage item for transaction fees
        // You'll need to find the correct usage item ID for the subscription
        // This part is highly dependent on your Stripe product/pricing setup.
        // For now, we'll just log it.
        console.log(`Company ${sub.company_id}: Gross Tips Volume: ${grossTipsVolume}, Transaction Fee: ${transactionFee}`);

        // Example of reporting usage (requires a metered price in Stripe)
        // const subscriptionItem = await stripe.subscriptionItems.list({
        //   subscription: sub.stripe_subscription_id,
        //   limit: 1, // Assuming one metered item per subscription
        // });
        // if (subscriptionItem.data.length > 0) {
        //   await stripe.subscriptionItems.createUsageRecord(
        //     subscriptionItem.data[0].id,
        //     {
        //       quantity: Math.round(transactionFee * 100), // Report in cents
        //       timestamp: Math.floor(today.getTime() / 1000),
        //       action: 'set', // 'set' or 'increment'
        //     }
        //   );
        //   console.log(`Reported usage for company ${sub.company_id}: ${transactionFee} (cents)`);
        // } else {
        //   console.warn(`No metered subscription item found for subscription ${sub.stripe_subscription_id}. Cannot report usage.`);
        // }
      }
    }
    console.log('Monthly billing job completed.');
  } catch (error) {
    console.error('Error running monthly billing job:', error);
  }
};

module.exports = {
  runMonthlyBilling,
};
