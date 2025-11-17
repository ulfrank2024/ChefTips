import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { createPlan, getPlans, updatePlan, deactivatePlan } from '../api/adminApi';

const PlansPage = () => {
  const { t } = useTranslation(['pages/plans', 'common', 'errors']);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // For editing
  const [formData, setFormData] = useState({
    name: '',
    monthly_fee: '',
    transaction_fee_percent: '',
    default_trial_days: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    setCurrentPlan(plan);
    if (plan) {
      setFormData({
        name: plan.name,
        monthly_fee: plan.monthly_fee / 100, // Convert cents to dollars
        transaction_fee_percent: plan.transaction_fee_percent,
        default_trial_days: plan.default_trial_days,
        is_active: plan.is_active,
      });
    } else {
      setFormData({
        name: '',
        monthly_fee: '',
        transaction_fee_percent: '',
        default_trial_days: '',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPlan(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const dataToSend = {
        ...formData,
        monthly_fee: parseFloat(formData.monthly_fee) * 100, // Convert dollars to cents
        transaction_fee_percent: parseFloat(formData.transaction_fee_percent),
        default_trial_days: parseInt(formData.default_trial_days, 10),
      };

      if (currentPlan) {
        await updatePlan(currentPlan.id, dataToSend);
      } else {
        await createPlan(dataToSend);
      }
      fetchPlans();
      handleCloseDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm(t('confirm_deactivate'))) {
      try {
        await deactivatePlan(id);
        fetchPlans();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
        {t('create_new_plan')}
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('plan_name')}</TableCell>
              <TableCell>{t('monthly_fee')}</TableCell>
              <TableCell>{t('transaction_fee')}</TableCell>
              <TableCell>{t('trial_days')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>{t('loading')}</TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>${plan.monthly_fee / 100}</TableCell>
                  <TableCell>{plan.transaction_fee_percent}%</TableCell>
                  <TableCell>{plan.default_trial_days}</TableCell>
                  <TableCell>{plan.is_active ? t('active') : t('inactive')}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleOpenDialog(plan)}>
                      {t('edit')}
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeactivate(plan.id)} disabled={!plan.is_active}>
                      {t('deactivate')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentPlan ? t('edit_plan') : t('create_new_plan')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label={t('plan_name')}
            type="text"
            fullWidth
            variant="standard"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="monthly_fee"
            label={t('monthly_fee')}
            type="number"
            fullWidth
            variant="standard"
            value={formData.monthly_fee}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="transaction_fee_percent"
            label={t('transaction_fee')}
            type="number"
            fullWidth
            variant="standard"
            value={formData.transaction_fee_percent}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="default_trial_days"
            label={t('trial_days')}
            type="number"
            fullWidth
            variant="standard"
            value={formData.default_trial_days}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
                color="primary"
              />
            }
            label={t('is_active')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('cancel')}</Button>
          <Button onClick={handleSubmit}>{currentPlan ? t('update') : t('create')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlansPage;
