import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box,
  Typography, CircularProgress, Alert, Grid, Paper, InputAdornment, Chip,
  Stepper, Step, StepLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { createCashOutReport, getTipOutRules, calculateTipDistribution } from '../../api/tipApi';
import { getCompanyEmployees } from '../../api/authApi';
import { useAlert } from '../../context/AlertContext';
import EmployeeRecipientSelectionModal from './EmployeeRecipientSelectionModal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const steps = ['enterDetails', 'selectRecipients', 'previewAndConfirm'];

const DeclareTipModal = ({
  open,
  onClose,
  onTipDeclared,
  initialDate = dayjs(),
  currentUser,
}) => {
  const { t } = useTranslation(['pages/serverDashboard', 'common', 'errors']);
  const { showAlert } = useAlert();
  const initialDateRef = useRef(initialDate);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [foodSales, setFoodSales] = useState('');
  const [alcoholSales, setAlcoholSales] = useState('');
  const [cashOnHand, setCashOnHand] = useState('');
  const [serviceDate, setServiceDate] = useState(initialDateRef.current);
  const [serviceEndTime, setServiceEndTime] = useState(dayjs());

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data state
  const [tipOutRules, setTipOutRules] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Recipient selection state
  const [selectedRecipientsByRule, setSelectedRecipientsByRule] = useState({});
  const [currentRuleForSelection, setCurrentRuleForSelection] = useState(null);
  const [isRecipientSelectionModalOpen, setIsRecipientSelectionModalOpen] = useState(false);

  // Preview states
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const resetModalState = useCallback(() => {
    setActiveStep(0);
    setFoodSales('');
    setAlcoholSales('');
    setCashOnHand('');
    setServiceDate(initialDateRef.current);
    setServiceEndTime(dayjs());
    setError('');
    setLoading(false);
    setSelectedRecipientsByRule({});
    setCurrentRuleForSelection(null);
    setIsRecipientSelectionModalOpen(false);
    setPreviewData(null);
    setPreviewLoading(false);
  }, []);

  // Effect to reset state when the modal opens
  useEffect(() => {
    if (open) {
      resetModalState();
    }
  }, [open, resetModalState]);

  // Effect to fetch initial data when the modal opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      const fetchInitialData = async () => {
        try {
          const [rulesData, employeesData] = await Promise.all([
            getTipOutRules(),
            getCompanyEmployees()
          ]);
          setTipOutRules(rulesData);
          setAllEmployees(employeesData);
        } catch (err) {
          setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [open]);


  const handlePreviewCalculation = useCallback(async () => {
    setPreviewLoading(true);
    setError('');
    try {
      const calculatedGrossTips = parseFloat(foodSales || 0) + parseFloat(alcoholSales || 0);
      const payload = {
        food_sales: parseFloat(foodSales || 0),
        alcohol_sales: parseFloat(alcoholSales || 0),
        gross_tips: calculatedGrossTips,
        cash_on_hand: parseFloat(cashOnHand || 0),
        service_date: serviceDate.format('YYYY-MM-DD'),
        selected_recipients: Object.entries(selectedRecipientsByRule).map(([ruleId, user_ids]) => ({
          rule_id: ruleId,
          user_ids: user_ids,
        })),
      };
      const response = await calculateTipDistribution(payload);
      setPreviewData(response);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [foodSales, alcoholSales, cashOnHand, serviceDate, selectedRecipientsByRule, t]);

  useEffect(() => {
    if (activeStep === 2) {
      handlePreviewCalculation();
    }
  }, [activeStep, handlePreviewCalculation]);


  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleOpenRecipientSelection = (rule) => {
    setCurrentRuleForSelection(rule);
    setIsRecipientSelectionModalOpen(true);
  };

  const handleSaveRecipients = (ruleId, recipients) => {
    setSelectedRecipientsByRule(prev => ({
      ...prev,
      [ruleId]: recipients,
    }));
    setIsRecipientSelectionModalOpen(false);
  };

  const handleDeclareTips = async () => {
    setError('');
    setLoading(true);
    try {
      const calculatedGrossTips = parseFloat(foodSales || 0) + parseFloat(alcoholSales || 0);
      const payload = {
        service_date: serviceDate.format('YYYY-MM-DD'),
        was_collector: true,
        food_sales: parseFloat(foodSales || 0),
        alcohol_sales: parseFloat(alcoholSales || 0),
        gross_tips: calculatedGrossTips,
        cash_on_hand: parseFloat(cashOnHand || 0),
        service_end_time: serviceEndTime.format('HH:mm:ss'),
        selected_recipients: Object.entries(selectedRecipientsByRule).map(([ruleId, user_ids]) => ({
          rule_id: ruleId,
          user_ids: user_ids,
        })),
      };
      await createCashOutReport(payload);
      showAlert(t('tipDeclaredSuccess'), 'success');
      onClose();
      onTipDeclared();
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const handleNumericInputChange = (setter) => (event) => {
    const { value } = event.target;
    // Allow only numbers (positive/negative) and a single decimal point
    if (/^-?\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label={t('serviceDate')}
                value={serviceDate}
                onChange={(newValue) => setServiceDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('serviceEndTime')}
                type="time"
                value={serviceEndTime.format('HH:mm')}
                onChange={(e) => setServiceEndTime(dayjs(`2000-01-01T${e.target.value}`))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('foodSales')}
                fullWidth
                value={foodSales}
                onChange={handleNumericInputChange(setFoodSales)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('alcoholSales')}
                fullWidth
                value={alcoholSales}
                onChange={handleNumericInputChange(setAlcoholSales)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('cashOnHand')}
                fullWidth
                value={cashOnHand}
                onChange={handleNumericInputChange(setCashOnHand)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('tipOutRecipients')}</Typography>
            <Paper elevation={1} sx={{ p: 2 }}>
              {tipOutRules.filter(rule => rule.distribution_type === 'INDIVIDUAL_SELECTION').length === 0 ? (
                <Typography>{t('noIndividualSelectionRules')}</Typography>
              ) : (
                tipOutRules.filter(rule => rule.distribution_type === 'INDIVIDUAL_SELECTION').map(rule => (
                  <Box key={rule.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'text.primary' }}>{rule.name}</Typography>
                      <Button variant="outlined" onClick={() => handleOpenRecipientSelection(rule)}>
                        {selectedRecipientsByRule[rule.id]?.length > 0 ? t('editRecipients') : t('selectRecipients')}
                      </Button>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      {selectedRecipientsByRule[rule.id]?.map(id => {
                        const employee = allEmployees.find(emp => emp.id === id);
                        return employee ? <Chip key={id} label={`${employee.first_name} ${employee.last_name}`} sx={{ mr: 1, mb: 1 }} /> : null;
                      })}
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        );
      case 2:
        const totalSales = parseFloat(foodSales || 0) + parseFloat(alcoholSales || 0);
        return (
          <Box sx={{ mt: 2 }}>
            {previewLoading ? <CircularProgress /> :
              previewData ? (
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'black' }}>{t('calculationSummary')}</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography sx={{ color: 'black' }}><strong>{t('totalSales')}:</strong></Typography></Grid>
                    <Grid item xs={6}><Typography align="right" sx={{ color: 'black' }}>${totalSales.toFixed(2)}</Typography></Grid>

                    <Grid item xs={6}><Typography sx={{ color: 'black' }}><strong>{t('cashOnHand')}:</strong></Typography></Grid>
                    <Grid item xs={6}><Typography align="right" sx={{ color: 'black' }}>${parseFloat(cashOnHand || 0).toFixed(2)}</Typography></Grid>

                    <Grid item xs={6}><Typography color="secondary"><strong>{t('totalTipOuts')}:</strong></Typography></Grid>
                    <Grid item xs={6}><Typography color="secondary" align="right">${(previewData.summary?.totalTipOutsFromCollector ?? 0).toFixed(2)}</Typography></Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 3, mb: 1, color: 'black' }}>{t('tipDistributionDetails')}</Typography>
                  {previewData.details?.map((detail, index) => (
                    <Box key={index} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'black' }}><strong>{detail.ruleName}:</strong> ${(detail.amount ?? 0).toFixed(2)}</Typography>
                      {detail.type === 'individual' && detail.recipients?.map((recipient, recIndex) => (
                        <Typography key={recIndex} variant="body2" sx={{ ml: 2, color: 'black' }}>- {recipient.first_name} {recipient.last_name}: ${(recipient.amount ?? 0).toFixed(2)}</Typography>
                      ))}
                       {detail.type === 'department' && (
                        <Typography variant="body2" sx={{ ml: 2, color: 'black' }}>- {t('kitchenPool')}: ${(detail.amount ?? 0).toFixed(2)}</Typography>
                      )}
                    </Box>
                  ))}
                  
                  <Typography variant="h5" align="right" sx={{ mt: 3, color: 'black' }}>
                    <strong>{t('dueBack')}:</strong> ${(previewData.summary?.dueBack ?? 0).toFixed(2)}
                  </Typography>

                  {(previewData.summary?.dueBack ?? 0) > 0 && (
                    <Typography align="center" sx={{ backgroundColor: 'red', color: 'white', p: 1, mt: 1, borderRadius: 1 }}>
                      {t('dueBackPositiveMessage', { amount: `${Math.abs(previewData.summary?.dueBack ?? 0).toFixed(2)}` })}
                    </Typography>
                  )}
                  {(previewData.summary?.dueBack ?? 0) < 0 && (
                    <Typography align="center" sx={{ backgroundColor: 'green', color: 'white', p: 1, mt: 1, borderRadius: 1 }}>
                      {t('dueBackNegativeMessage', { amount: `${Math.abs(previewData.summary?.dueBack ?? 0).toFixed(2)}` })}
                    </Typography>
                  )}
                  {(previewData.summary?.dueBack ?? 0) === 0 && (
                    <Typography align="center" sx={{ backgroundColor: 'orange', color: 'white', p: 1, mt: 1, borderRadius: 1 }}>
                      {t('dueBackZeroMessage')}
                    </Typography>
                  )}
                </Paper>
              ) : <Typography sx={{ color: 'black' }}>{t('noPreviewData')}</Typography>
            }
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{t('declareTipsTitle')}</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ minHeight: 300, p: 2 }}>
            {getStepContent(activeStep)}
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button disabled={activeStep === 0} onClick={handleBack}>
            {t('back', { ns: 'common' })}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button onClick={handleDeclareTips} variant="contained" disabled={loading || previewLoading || !previewData}>
              {loading ? <CircularProgress size={24} /> : t('declareTips')}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              {t('next', { ns: 'common' })}
            </Button>
          )}
        </DialogActions>

        {currentRuleForSelection && (
          <EmployeeRecipientSelectionModal
            open={isRecipientSelectionModalOpen}
            onClose={() => setIsRecipientSelectionModalOpen(false)}
            employees={allEmployees.filter(emp => emp.id !== currentUser.id && emp.role !== 'CUISINIER')}
            rule={currentRuleForSelection}
            initialSelected={selectedRecipientsByRule[currentRuleForSelection.id] || []}
            onSave={handleSaveRecipients}
          />
        )}
      </Dialog>
    </LocalizationProvider>
  );
};

export default DeclareTipModal;
