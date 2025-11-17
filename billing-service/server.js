const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');
const stripeRoutes = require('./routes/stripeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const billingApiRoutes = require('./routes/billingApiRoutes'); // Import billing API routes
const adminRoutes = require('./routes/adminRoutes');
const { runMonthlyBilling } = require('./jobs/monthlyBillingJob');

dotenv.config();

const app = express();

// Stripe webhook needs the raw body, so it must come before express.json()
app.use('/stripe', stripeRoutes); // Mount Stripe routes

app.use(express.json()); // For parsing application/json

app.use('/subscriptions', subscriptionRoutes); // Mount subscription routes
app.use('/api', billingApiRoutes); // Mount billing API routes
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 4002;

app.get('/', (req, res) => {
  res.send('Billing Service is running');
});

app.listen(PORT, () => {
  console.log(`Billing Service running on port ${PORT}`);

  // Schedule the monthly billing job to run on the 1st of every month at 2 AM
  // In a real production environment, consider using AWS Lambda or similar for cron jobs
  cron.schedule('0 2 1 * *', () => {
    console.log('Starting scheduled monthly billing job...');
    runMonthlyBilling();
  }, {
    scheduled: true,
    timezone: "America/New_York" // Or your desired timezone
  });

  // Optionally, run the job immediately for testing purposes
  // runMonthlyBilling();
});
