const express = require('express');
const cron = require('node-cron');
const stripeRoutes = require('./routes/stripeRoutes');
const cors = require('cors'); // Import the cors middleware
console.log('stripeRoutes loaded:', stripeRoutes);
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const billingApiRoutes = require('./routes/billingApiRoutes'); // Import billing API routes
const adminRoutes = require('./routes/adminRoutes');
const { runMonthlyBilling } = require('./jobs/monthlyBillingJob');

const app = express();

// Stripe webhook needs the raw body, so it must come before express.json()
app.use('/stripe', stripeRoutes); // Mount Stripe routes

app.use(express.json()); // For parsing application/json

// Configure CORS for http://localhost:5173
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.cheftips.app', 'https://admin-web-app-gray.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-auth']
}));

// Harmonise les montages des routes pour correspondre aux attentes du frontend
app.use('/api/billing/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingApiRoutes); // Corrigé pour le préfixe /api/billing
app.use('/api/billing/admin', adminRoutes);

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
