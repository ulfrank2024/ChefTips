import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, Button, TextField,
  Grid, Checkbox, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getPayPeriodSummary, createPool, getPools } from '../../api/tipApi';
import { getCompanyEmployees, getCompanyCategories } from '../../api/authApi';
import { getPayoutPeriods } from '../../api/payoutPeriodApi';

dayjs.extend(utc);

const CreatePool = () => {
  const { t } = useTranslation(['components/manager/createPool', 'common', 'errors']);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  
  const [report, setReport] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState({});

  const [payoutPeriods, setPayoutPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [pools, setPools] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, periods, existingPools, cats] = await Promise.all([
        getCompanyEmployees(),
        getPayoutPeriods(),
        getPools(),
        getCompanyCategories()
      ]);
      setEmployees(emps);
      const pastPeriods = periods.filter(period => dayjs.utc(period.end_date).isBefore(dayjs.utc(), 'day'));
      setPayoutPeriods(pastPeriods);
      setPools(existingPools);
      setCategories(cats.filter(cat => cat.is_tip_distribution_pool));
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrepareDistribution = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const existingPoolForPeriod = pools.some(pool =>
        dayjs.utc(pool.start_date).isSame(startDate, 'day') &&
        dayjs.utc(pool.end_date).isSame(endDate, 'day')
      );

      if (existingPoolForPeriod) {
        setError(t('errors:POOL_ALREADY_EXISTS_FOR_PERIOD'));
        setLoading(false);
        return;
      }

      const reports = await Promise.all(
        categories.map(cat => {
          if (!cat.is_tip_distribution_pool) return null;
          return getPayPeriodSummary(cat.id, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));
        })
      );
      
      const augmentedReports = reports.filter(r => r).map((r, index) => ({
        ...r,
        category: categories.filter(c => c.is_tip_distribution_pool)[index],
        editable_total_tip_out_amount: r.total_tip_out_amount
      }));
      setReport(augmentedReports);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const handleTotalAmountChange = (catIndex, newValue) => {
    const newReport = [...report];
    const numericValue = parseFloat(newValue) || 0;
    newReport[catIndex].editable_total_tip_out_amount = numericValue;
    setReport(newReport);
  };

  const handleEmployeeSelect = (catId, empId) => {
    const newSelection = { ...selectedEmployees };
    if (!newSelection[catId]) newSelection[catId] = {};
    newSelection[catId][empId] = { ...newSelection[catId][empId], selected: !newSelection[catId][empId]?.selected };
    setSelectedEmployees(newSelection);
  };

  const handleHoursChange = (catId, empId, hours) => {
    const newSelection = { ...selectedEmployees };
    if (!newSelection[catId]) newSelection[catId] = {};
    newSelection[catId][empId] = { ...newSelection[catId][empId], hours: Number(hours) };
    setSelectedEmployees(newSelection);
  };

  const handleDistribute = async (category, totalAmount) => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!category) {
        setError(t('errors:INVALID_CATEGORY'));
        setLoading(false);
        return;
    }

    const existingPoolForCategoryAndPeriod = pools.some(pool =>
      pool.category_id === category.id &&
      dayjs.utc(pool.start_date).isSame(startDate, 'day') &&
      dayjs.utc(pool.end_date).isSame(endDate, 'day')
    );

    if (existingPoolForCategoryAndPeriod) {
      setError(t('errors:POOL_ALREADY_EXISTS_FOR_CATEGORY_AND_PERIOD', { category: category.name }));
      setLoading(false);
      return;
    }

    const distributions = Object.entries(selectedEmployees[category.id] || {})
      .filter(([, data]) => data.selected)

    const missingHours = distributions.some(([, data]) => data.hours === undefined || data.hours === null || data.hours === '');
    if (missingHours) {
        setError(t('errors:HOURS_REQUIRED_FOR_SELECTED_EMPLOYEES'));
        setLoading(false);
        return;
    }

    const distributionsWithHours = distributions.map(([user_id, data]) => ({ user_id, hours_worked: data.hours }));

    const totalHours = distributionsWithHours.reduce((sum, emp) => sum + emp.hours_worked, 0);
    if (totalHours === 0) {
      setError(t('errors:TOTAL_HOURS_CANNOT_BE_ZERO'));
      setLoading(false);
      return;
    }

    const finalDistributions = distributionsWithHours.map(emp => ({
      ...emp,
      distributed_amount: (totalAmount * emp.hours_worked) / totalHours
    }));

    try {
      await createPool({
        categoryId: category.id,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        distributions: finalDistributions,
        totalAmount: totalAmount
      });
      setSuccess(t('DISTRIBUTION_SUCCESS', { ns: 'common' }));
      setSelectedEmployees(prev => ({...prev, [category.id]: {}}));
      fetchData(); 
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>{t('title')}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>} 
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Select
                labelId="payout-period-select-label"
                label={t('payoutPeriod', { ns: 'common' })}
                value={selectedPeriod}
                onChange={(e) => {
                  const periodId = e.target.value;
                  setSelectedPeriod(periodId);
                  if (periodId) {
                    const period = payoutPeriods.find(p => p.id === periodId);
                    setStartDate(dayjs.utc(period.start_date));
                    setEndDate(dayjs.utc(period.end_date));
                  } else {
                    setStartDate(dayjs().startOf('month'));
                    setEndDate(dayjs().endOf('month'));
                  }
                }}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: { zIndex: (theme) => theme.zIndex.drawer + 2 }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                }}
                inputProps={{ 'aria-label': t('payoutPeriod', { ns: 'common' }) }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <em>{t('selectAPeriodPlaceholder', { ns: 'components/manager/createPool' })}</em>;
                  }                  const selectedPeriod = payoutPeriods.find(p => p.id === selected);
                  return selectedPeriod ? `${selectedPeriod.name} (${dayjs.utc(selectedPeriod.start_date).format('YYYY-MM-DD')} - ${dayjs.utc(selectedPeriod.end_date).format('YYYY-MM-DD')})` : '';
                }}
              >
                <MenuItem value="">
                  <em>{t('selectAPeriodPlaceholder', { ns: 'components/manager/createPool' })}</em>
                </MenuItem>
                {payoutPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id} sx={{ fontSize: '0.875rem' }}>
                    {period.name} ({dayjs.utc(period.start_date).format('YYYY-MM-DD')} - {dayjs.utc(period.end_date).format('YYYY-MM-DD')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" onClick={handlePrepareDistribution} sx={{ height: '56px' }} disabled={loading || !selectedPeriod}>{t('prepareDistribution')}</Button>
          </Grid>
        </Grid>
      </Paper>

      {report && report.map((catReport, index) => {
        const category = catReport.category;
        const categoryEmployees = employees.filter(emp => emp.category_id === category.id);

        return (
          <Paper key={category.id} elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">{category.name}</Typography>
            <TextField
              label={t('totalAmount')}
              type="number"
              variant="outlined"
              value={catReport.editable_total_tip_out_amount.toFixed(2)}
              onChange={(e) => handleTotalAmountChange(index, e.target.value)}
              sx={{ mt: 1, mb: 2, width: '25ch' }}
              InputProps={{
                endAdornment: <InputAdornment position="end">$</InputAdornment>,
              }}
            />
            
            <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <List dense>
                {categoryEmployees.map(emp => (
                  <ListItem
                    key={emp.id}
                    secondaryAction={
                      selectedEmployees[category.id]?.[emp.id]?.selected && (
                        <TextField
                          type="number"
                          label={t('hoursWorked')}
                          variant="outlined"
                          size="small"
                          value={selectedEmployees[category.id]?.[emp.id]?.hours || ''}
                          onChange={(e) => handleHoursChange(category.id, emp.id, e.target.value)}
                          sx={{ width: '100px' }}
                        />
                      )
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => handleEmployeeSelect(category.id, emp.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedEmployees[category.id]?.[emp.id]?.selected || false}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText primary={`${emp.first_name} ${emp.last_name}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
            <Button variant="contained" color="secondary" onClick={() => handleDistribute(category, catReport.editable_total_tip_out_amount)} sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : `${t('distributeFor')} ${category.name}`}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
};

export default CreatePool;