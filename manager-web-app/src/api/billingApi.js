import axios from 'axios';

const BILLING_API_URL = (import.meta.env.VITE_BILLING_API_URL || 'http://localhost:4002') + '/api/billing';

const billingApi = axios.create({
  baseURL: BILLING_API_URL,
});

export const getPlans = async () => {
  try {
    const response = await billingApi.get('/plans');
    return response.data;
  } catch (error) {
    console.error('Error fetching billing plans:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async (companyId) => {
  try {
    const response = await billingApi.get(`/subscriptions/${companyId}/status`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subscription status for company ${companyId}:`, error);
    throw error;
  }
};

export const createCheckoutSession = async (planId, companyId) => {
  try {
    const response = await billingApi.post('/create-checkout-session', { planId, companyId });
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createCustomerPortalSession = async (customerId) => {
  try {
    const response = await billingApi.post('/create-customer-portal-session', { customerId });
    return response.data;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

export default billingApi;
