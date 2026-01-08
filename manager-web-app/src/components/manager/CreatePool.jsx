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
import { getCompanyEmployees, getCompanyCategories } from '../../api/authApi'; // Updated import
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
  const [categories, setCategories] = useState([]); // Renamed from departments
  const [tipPoolCategories, setTipPoolCategories] = useState([]); // To store categories that are tip distribution pools

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, periods, existingPools, allCategories] = await Promise.all([
        getCompanyEmployees(),
        getPayoutPeriods(),
        getPools(), // Fetch existing pools
        getCompanyCategories() // Updated call
      ]);
      setEmployees(emps);
      // Filter periods to only show past periods
      const pastPeriods = periods.filter(period => dayjs.utc(period.end_date).isBefore(dayjs.utc(), 'day'));
      setPayoutPeriods(pastPeriods);
      setPools(existingPools);
      setCategories(allCategories);
      setTipPoolCategories(allCategories.filter(cat => cat.is_tip_distribution_pool)); // Filter for tip distribution pools
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
      // Check for existing pools for the selected period and category
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
        tipPoolCategories.map(category => { // Iterate over tipPoolCategories
          return getPayPeriodSummary(category.id, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));
        })
      );
      
      const augmentedReports = reports.filter(r => r).map((r, index) => ({
        ...r,
        category: tipPoolCategories[index].name, // Use category name
        editable_total_tip_out_amount: r.total_tip_out_amount
      }));
      setReport(augmentedReports);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const handleTotalAmountChange = (catIndex, newValue) => { // Renamed deptIndex to catIndex
    const newReport = [...report];
    const numericValue = parseFloat(newValue) || 0;
    newReport[catIndex].editable_total_tip_out_amount = numericValue;
    setReport(newReport);
  };

  const handleEmployeeSelect = (categoryId, empId) => { // Renamed deptId to categoryId
    const newSelection = { ...selectedEmployees };
    if (!newSelection[categoryId]) newSelection[categoryId] = {};
    newSelection[categoryId][empId] = { ...newSelection[categoryId][empId], selected: !newSelection[categoryId][empId]?.selected };
    setSelectedEmployees(newSelection);
  };

  const handleHoursChange = (categoryId, empId, hours) => { // Renamed deptId to categoryId
    const newSelection = { ...selectedEmployees };
    if (!newSelection[categoryId]) newSelection[categoryId] = {};
    newSelection[categoryId][empId] = { ...newSelection[categoryId][empId], hours: Number(hours) };
    setSelectedEmployees(newSelection);
  };

  const handleDistribute = async (categoryName, totalAmount) => { // Renamed role to categoryName
    setError('');
    setSuccess('');
    setLoading(true);

    const category = categories.find(c => c.name === categoryName); // Renamed department to category
    if (!category) {
        setError(t('errors:INVALID_CATEGORY')); // Updated error message
        setLoading(false);
        return;
    }

    // Check for existing pool for this specific category and period before distributing
    const existingPoolForCategoryAndPeriod = pools.some(pool =>
      pool.category_name === categoryName && // Updated to category_name
      dayjs.utc(pool.start_date).isSame(startDate, 'day') &&
      dayjs.utc(pool.end_date).isSame(endDate, 'day')
    );

    if (existingPoolForCategoryAndPeriod) {
      setError(t('errors:POOL_ALREADY_EXISTS_FOR_CATEGORY_AND_PERIOD', { category: categoryName })); // Updated error message
      setLoading(false);
      return;
    }

    const distributions = Object.entries(selectedEmployees[categoryName] || {}) // Use categoryName as key
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
        categoryId: category.id, // Updated to categoryId
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        distributions: finalDistributions,
        totalAmount: totalAmount // Add this line
      });
      setSuccess(t('DISTRIBUTION_SUCCESS', { ns: 'common' }));
      // Reset selections for the current category and refetch data to update existing pools
      setSelectedEmployees(prev => ({...prev, [categoryName]: {}}));
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

      {report && report.map((catReport, index) => { // Renamed deptReport to catReport
        const category = tipPoolCategories[index]; // Use tipPoolCategories for iteration
        const categoryEmployees = employees.filter(emp => emp.category_id === category.id); // Filter by category_id

        return (
          <Paper key={category.id} elevation={3} sx={{ p: 3, mb: 3 }}> {/* Use category.id as key */}
            <Typography variant="h6">{t(category.name.toLowerCase(), { ns: 'components/manager/manageRules' })}</Typography> {/* Use category.name */}
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
                      selectedEmployees[category.name]?.[emp.id]?.selected && ( // Use category.name as key
                        <TextField
                          type="number"
                          label={t('hoursWorked')}
                          variant="outlined"
                          size="small"
                          value={selectedEmployees[category.name]?.[emp.id]?.hours || ''} // Use category.name as key
                          onChange={(e) => handleHoursChange(category.name, emp.id, e.target.value)} // Use category.name as key
                          sx={{ width: '100px' }}
                        />
                      )
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => handleEmployeeSelect(category.name, emp.id)}> {/* Use category.name as key */}
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedEmployees[category.name]?.[emp.id]?.selected || false} // Use category.name as key
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
            <Button variant="contained" color="secondary" onClick={() => handleDistribute(category.name, catReport.editable_total_tip_out_amount)} sx={{ mt: 2 }} disabled={loading}> {/* Use category.name */}
              {loading ? <CircularProgress size={24} /> : t('distributeFor')} {t(category.name.toLowerCase(), { ns: 'components/manager/manageRules' })} {/* Use category.name */}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
};

export default CreatePool;