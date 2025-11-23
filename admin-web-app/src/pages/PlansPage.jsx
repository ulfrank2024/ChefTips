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
  Alert as MuiAlert, // Renamed to avoid conflict with Snackbar Alert
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Snackbar,
  DialogContentText,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { createPlan, getPlans, updatePlan, deactivatePlan } from '../api/adminApi';

const PlansPage = () => {
  const { t } = useTranslation(['pages/plans', 'common', 'errors']);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // For editing
  const [originalPlanData, setOriginalPlanData] = useState(null); // To compare changes
  const [formData, setFormData] = useState({
    name: '',
    monthly_fee: '',
    transaction_fee_percent: '',
    default_trial_days: '',
    is_active: true,
  });
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [planToDeactivate, setPlanToDeactivate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });


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
      setOriginalPlanData({ // Store original data for comparison
        name: plan.name,
        monthly_fee: plan.monthly_fee / 100,
        transaction_fee_percent: plan.transaction_fee_percent,
        default_trial_days: plan.default_trial_days,
        is_active: plan.is_active,
      });
      setFormData({
        name: plan.name,
        monthly_fee: plan.monthly_fee / 100, // Convert cents to dollars
        transaction_fee_percent: plan.transaction_fee_percent,
        default_trial_days: plan.default_trial_days,
        is_active: plan.is_active,
      });
    } else {
      setOriginalPlanData(null); // No original data for new plan
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
    setOpenConfirmDialog(false);
    setCurrentPlan(null);
    setOriginalPlanData(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getChangedFields = () => {
    const changes = {};
    if (!currentPlan) return formData; // For new plans, all are new

    for (const key in formData) {
      // Handle monthly_fee conversion for comparison
      const originalValue = key === 'monthly_fee' ? originalPlanData[key] : originalPlanData[key];
      const currentValue = key === 'monthly_fee' ? parseFloat(formData[key]) : formData[key];

      if (originalValue !== currentValue) {
        changes[key] = {
          old: originalValue,
          new: currentValue,
        };
      }
    }
    return changes;
  };

  const handleSubmit = () => {
    setError(null);
    // Open confirmation dialog before actual submission
    setOpenConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
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

  const handleDeactivateClick = (plan) => {
    setPlanToDeactivate(plan);
    setDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (planToDeactivate) {
      try {
        await deactivatePlan(planToDeactivate.id);
        fetchPlans();
        setSnackbar({ open: true, message: t('plan_deactivated_success'), severity: 'success' });
      } catch (err) {
        setError(err.message);
      } finally {
        setDeactivateDialogOpen(false);
        setPlanToDeactivate(null);
      }
    }
  };

  const handleCloseDeactivateDialog = () => {
    setDeactivateDialogOpen(false);
    setPlanToDeactivate(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const changedFields = getChangedFields();
  const hasChanges = Object.keys(changedFields).length > 0;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
        {t('create_new_plan')}
      </Button>

      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

      <TableContainer component={Paper} sx={{ boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('plan_name')}</TableCell>
              <TableCell>{t('monthly_fee')}</TableCell>
              <TableCell>{t('transaction_fee')}</TableCell>
              <TableCell>{t('trial_days')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell>{t('created_at')}</TableCell>
              <TableCell>{t('updated_at')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>{t('loading')}</TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{t('currency_symbol')}{plan.monthly_fee / 100}</TableCell>
                  <TableCell>{plan.transaction_fee_percent}{t('percentage_symbol')}</TableCell>
                  <TableCell>{plan.default_trial_days}</TableCell>
                  <TableCell>
                    <Chip
                        label={plan.is_active ? t('active') : t('inactive')}
                        color={plan.is_active ? 'success' : 'error'}
                        size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(plan.created_at)}</TableCell>
                  <TableCell>{formatDate(plan.updated_at)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleOpenDialog(plan)}>
                      {t('edit')}
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeactivateClick(plan)} disabled={!plan.is_active}>
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

      {/* Confirmation Dialog for Create/Update */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>{currentPlan ? t('confirm_update_plan') : t('confirm_create_plan')}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('please_review_changes')}:
          </Typography>
          {hasChanges ? (
            <List>
              {Object.keys(changedFields).map((key) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={t(key)}
                    secondary={currentPlan
                      ? `${t('old_value')}: ${changedFields[key].old}, ${t('new_value')}: ${changedFields[key].new}`
                      : `${t('new_value')}: ${changedFields[key]}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>{t('no_changes_made')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleConfirmSubmit} disabled={!hasChanges} color="primary" variant="contained">
            {currentPlan ? t('confirm_update') : t('confirm_create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivation Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={handleCloseDeactivateDialog}
      >
        <DialogTitle>{t('confirm_deactivation_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirm_deactivate_message', { planName: planToDeactivate?.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeactivateDialog}>{t('cancel')}</Button>
          <Button onClick={handleConfirmDeactivate} color="error" autoFocus>
            {t('deactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PlansPage;
