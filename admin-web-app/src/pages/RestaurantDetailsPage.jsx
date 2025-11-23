import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompanyById, suspendCompany, reactivateCompany } from '../api/companyApi';
import { getSubscriptionByCompanyId, getPlans, updateSubscriptionPlan, updateTrialEndDate } from '../api/subscriptionApi';

const RestaurantDetailsPage = () => {
  const { t } = useTranslation(['pages/restaurantDetails', 'common', 'errors']);
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState('');
  const [newTrialEndDate, setNewTrialEndDate] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyData, subscriptionData, plansData] = await Promise.all([
          getCompanyById(id),
          getSubscriptionByCompanyId(id),
          getPlans(),
        ]);
        setCompany(companyData);
        setSubscription(subscriptionData);
        setPlans(plansData);
        if (subscriptionData) {
          setSelectedPlan(subscriptionData.plan_id);
          setNewTrialEndDate(subscriptionData.trial_ends_at ? subscriptionData.trial_ends_at.split('T')[0] : '');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleOpenDialog = (action) => {
    setActionToConfirm(() => action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setActionToConfirm(null);
  };

  const handleConfirmAction = () => {
    if (actionToConfirm) {
      actionToConfirm();
    }
    handleCloseDialog();
  };

  const suspendReactivateAction = async () => {
    try {
      if (company.is_active) {
        await suspendCompany(company.id);
        setCompany((prev) => ({ ...prev, is_active: false }));
        setSnackbar({ open: true, message: t('company_suspended_success'), severity: 'success' });
      } else {
        await reactivateCompany(company.id);
        setCompany((prev) => ({ ...prev, is_active: true }));
        setSnackbar({ open: true, message: t('company_reactivated_success'), severity: 'success' });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlanChange = async () => {
    try {
      await updateSubscriptionPlan(subscription.id, selectedPlan);
      const updatedSubscription = await getSubscriptionByCompanyId(id);
      setSubscription(updatedSubscription);
      setSnackbar({ open: true, message: t('plan_updated_success'), severity: 'success' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTrialExtension = async () => {
    try {
      await updateTrialEndDate(subscription.id, newTrialEndDate);
      const updatedSubscription = await getSubscriptionByCompanyId(id);
      setSubscription(updatedSubscription);
      setSnackbar({ open: true, message: t('trial_extended_success'), severity: 'success' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Typography>{t('loading')}</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!company) {
    return <Typography>{t('company_not_found')}</Typography>;
  }

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('title')} - {company.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>{t('company_details')}</Typography>
            <Typography><strong>{t('company_name')}:</strong> {company.name}</Typography>
            <Typography><strong>{t('company_status')}:</strong> {company.is_active ? t('active') : t('inactive')}</Typography>
            <Button
              variant="contained"
              color={company.is_active ? 'error' : 'primary'}
              onClick={() => handleOpenDialog(suspendReactivateAction)}
              sx={{ mt: 2 }}
            >
              {company.is_active ? t('suspend_company') : t('reactivate_company')}
            </Button>
          </Paper>
        </Grid>

        {subscription && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>{t('subscription_details')}</Typography>
              <Typography><strong>{t('subscription_status')}:</strong> {subscription.status}</Typography>
              <Typography><strong>{t('current_plan')}:</strong> {plans.find(p => p.id === subscription.plan_id)?.name || t('na')}</Typography>
              <Typography><strong>{t('trial_ends_at')}:</strong> {subscription.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : t('not_applicable')}</Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>{t('change_plan')}</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>{t('select_new_plan')}</InputLabel>
                  <Select
                    value={selectedPlan}
                    label={t('select_new_plan')}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.monthly_fee / 100}{t('per_month')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handlePlanChange}>
                  {t('update_plan')}
                </Button>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>{t('extend_trial')}</Typography>
                <TextField
                  fullWidth
                  type="date"
                  label={t('new_trial_end_date')}
                  value={newTrialEndDate}
                  onChange={(e) => setNewTrialEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={handleTrialExtension}>
                  {t('extend_trial_button')}
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{t('confirm_action')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('are_you_sure_you_want_to_perform_this_action')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common:cancel')}</Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>
            {t('common:confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestaurantDetailsPage;
