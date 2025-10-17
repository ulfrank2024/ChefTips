import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  CircularProgress, Alert, Stack, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Box
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { getCompanyEmployees, getTipOutRules } from '../../api/tipApi'; // Import new API functions

const DeclareTipModal = ({ open, onClose, onSubmitReport, categoryId, serviceDate }) => {
  const { t } = useTranslation(['common', 'pages/serverDashboard']);

  const [foodSales, setFoodSales] = useState('');
  const [alcoholSales, setAlcoholSales] = useState('');
  const [grossTips, setGrossTips] = useState('');
  const [cashDifference, setCashDifference] = useState('');
  const [endTime, setEndTime] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [allEmployees, setAllEmployees] = useState([]);
  const [individualSelectionRules, setIndividualSelectionRules] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState({}); // { ruleId: [userId1, userId2] }
  const [rulesLoading, setRulesLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const resetForm = () => {
    setFoodSales('');
    setAlcoholSales('');
    setGrossTips('');
    setCashDifference('');
    setEndTime(dayjs());
    setError('');
    setSelectedRecipients({});
  };

  useEffect(() => {
    if (open) {
      resetForm();
      const fetchData = async () => {
        setRulesLoading(true);
        setEmployeesLoading(true);
        try {
          const [employeesData, rulesData] = await Promise.all([
            getCompanyEmployees(),
            getTipOutRules()
          ]);
          setAllEmployees(employeesData);
          const individualRules = rulesData.filter(rule => rule.distribution_type === 'INDIVIDUAL_SELECTION');
          setIndividualSelectionRules(individualRules);

          // Initialize selectedRecipients state
          const initialSelectedRecipients = {};
          individualRules.forEach(rule => {
            initialSelectedRecipients[rule.id] = [];
          });
          setSelectedRecipients(initialSelectedRecipients);

        } catch (err) {
          setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
        } finally {
          setRulesLoading(false);
          setEmployeesLoading(false);
        }
      };
      fetchData();
    }
  }, [open, t]);

  const handleRecipientChange = (ruleId, event) => {
    const { target: { value } } = event;
    setSelectedRecipients(prev => ({
      ...prev,
      [ruleId]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (foodSales === '' || alcoholSales === '' || grossTips === '') {
      setError(t('fillAllFields', { ns: 'common' }));
      return;
    }
    if (isNaN(parseFloat(foodSales)) || isNaN(parseFloat(alcoholSales)) || isNaN(parseFloat(grossTips)) || isNaN(parseFloat(cashDifference))) {
      setError(t('INVALID_NUMBER', { ns: 'errors', defaultValue: 'Please enter valid numbers.' }));
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        category_id: categoryId,
        service_date: serviceDate,
        was_collector: true,
        food_sales: parseFloat(foodSales),
        alcohol_sales: parseFloat(alcoholSales),
        gross_tips: parseFloat(grossTips),
        cash_difference: parseFloat(cashDifference),
        manual_adjustments: [], // Manual adjustments are now handled by cashDifference or specific UI if needed
        service_end_time: endTime ? endTime.toISOString() : null,
        selected_recipients: Object.keys(selectedRecipients).map(ruleId => ({
          rule_id: ruleId,
          user_ids: selectedRecipients[ruleId]
        })),
      };

      await onSubmitReport(reportData);
      onClose();
    } catch (err) {
      if (err.message && err.message.includes("DAILY_REPORT_ALREADY_EXISTS")) {
        setError(t('DAILY_REPORT_ALREADY_EXISTS', { ns: 'errors' }));
      } else {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const isDataLoading = rulesLoading || employeesLoading;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('declareNewTip', { ns: 'pages/serverDashboard', defaultValue: 'Declare Daily Report' })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {isDataLoading && <CircularProgress />}

          {!isDataLoading && (
            <>
              <TextField
                autoFocus
                margin="dense"
                required
                fullWidth
                label={t('foodSales', { ns: 'pages/serverDashboard', defaultValue: 'Food Sales' })}
                type="number"
                value={foodSales}
                onChange={(e) => setFoodSales(e.target.value)}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                label={t('alcoholSales', { ns: 'pages/serverDashboard', defaultValue: 'Alcohol Sales' })}
                type="number"
                value={alcoholSales}
                onChange={(e) => setAlcoholSales(e.target.value)}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                label={t('grossTips', { ns: 'common', defaultValue: 'Gross Tips' })}
                type="number"
                value={grossTips}
                onChange={(e) => setGrossTips(e.target.value)}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                margin="dense"
                fullWidth
                label={t('cashDifference', { ns: 'pages/serverDashboard', defaultValue: 'Cash Difference (Positive if owed to restaurant, negative if owed to you)' })}
                type="number"
                value={cashDifference}
                onChange={(e) => setCashDifference(e.target.value)}
                inputProps={{ step: "0.01" }}
                helperText={t('cashDifferenceHelp', { ns: 'pages/serverDashboard', defaultValue: 'Enter positive if you owe the restaurant, negative if the restaurant owes you.' })}
              />

              {individualSelectionRules.map(rule => (
                <FormControl fullWidth margin="dense" key={rule.id}>
                  <InputLabel>{t('selectRecipientsFor', { ruleName: rule.name, ns: 'pages/serverDashboard' })}</InputLabel>
                  <Select
                    multiple
                    value={selectedRecipients[rule.id] || []}
                    onChange={(event) => handleRecipientChange(rule.id, event)}
                    input={<OutlinedInput label={t('selectRecipientsFor', { ruleName: rule.name, ns: 'pages/serverDashboard' })} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((userId) => {
                          const employee = allEmployees.find(emp => emp.id === userId);
                          return <Chip key={userId} label={`${employee?.first_name} ${employee?.last_name}`} />;
                        })}
                      </Box>
                    )}
                  >
                    {allEmployees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {`${employee.first_name} ${employee.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label={t('serviceEndTime', { ns: 'pages/serverDashboard', defaultValue: 'End of Shift Time' })}
                  value={endTime}
                  onChange={(newValue) => setEndTime(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                />
              </LocalizationProvider>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || isDataLoading}>
          {loading ? <CircularProgress size={24} /> : t('declare', { ns: 'common', defaultValue: 'Declare' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeclareTipModal;
