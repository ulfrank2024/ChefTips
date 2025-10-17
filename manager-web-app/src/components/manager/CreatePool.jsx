import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, Button, TextField,
  Grid, Checkbox, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { getDepartments, getPayPeriodSummary, createPool, getCategories } from '../../api/tipApi';
import { getCompanyEmployees } from '../../api/authApi';

const CreatePool = () => {
  const { t } = useTranslation(['components/manager/createPool', 'common', 'errors']);

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Add success state
  
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  
  const [report, setReport] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deps, emps, cats] = await Promise.all([getDepartments(), getCompanyEmployees(), getCategories()]);
      setDepartments(deps.filter(d => d.department_type === 'RECEIVER'));
      setEmployees(emps);
      setCategories(cats);
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
      const reports = await Promise.all(
        departments.map(d => getPayPeriodSummary(d.id, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')))
      );
      const augmentedReports = reports.map(r => ({
        ...r,
        editable_total_tip_out_amount: r.total_tip_out_amount
      }));
      setReport(augmentedReports);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const handleTotalAmountChange = (deptIndex, newValue) => {
    const newReport = [...report];
    const numericValue = parseFloat(newValue) || 0;
    newReport[deptIndex].editable_total_tip_out_amount = numericValue;
    setReport(newReport);
  };

  const handleEmployeeSelect = (deptId, empId) => {
    const newSelection = { ...selectedEmployees };
    if (!newSelection[deptId]) newSelection[deptId] = {};
    newSelection[deptId][empId] = { ...newSelection[deptId][empId], selected: !newSelection[deptId][empId]?.selected };
    setSelectedEmployees(newSelection);
  };

  const handleHoursChange = (deptId, empId, hours) => {
    const newSelection = { ...selectedEmployees };
    if (!newSelection[deptId]) newSelection[deptId] = {};
    newSelection[deptId][empId] = { ...newSelection[deptId][empId], hours: Number(hours) };
    setSelectedEmployees(newSelection);
  };

  const handleDistribute = async (department, totalAmount) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const distributions = Object.entries(selectedEmployees[department.id] || {})
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
        departmentId: department.id,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        distributions: finalDistributions,
        totalAmount: totalAmount // Add this line
      });
      setSuccess(t('DISTRIBUTION_SUCCESS', { ns: 'common' }));
      // Reset selections for the current department
      setSelectedEmployees(prev => ({...prev, [department.id]: {}}));
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  if (loading && departments.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>{t('title')}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>} 
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label={t('startDate', { ns: 'common' })} value={startDate} onChange={setStartDate} renderInput={(params) => <TextField {...params} fullWidth />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label={t('endDate', { ns: 'common' })} value={endDate} onChange={setEndDate} renderInput={(params) => <TextField {...params} fullWidth />} />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" onClick={handlePrepareDistribution} sx={{ height: '56px' }} disabled={loading}>{t('prepareDistribution')}</Button>
          </Grid>
        </Grid>
      </Paper>

      {report && report.map((deptReport, index) => {
        const department = departments[index];
        const departmentEmployees = employees.filter(emp => {
          const category = categories.find(c => c.id === emp.category_id);
          return category && category.department_id === department.id;
        });

        return (
          <Paper key={department.id} elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">{department.name}</Typography>
            <TextField
              label={t('totalAmount')}
              type="number"
              variant="outlined"
              value={deptReport.editable_total_tip_out_amount.toFixed(2)}
              onChange={(e) => handleTotalAmountChange(index, e.target.value)}
              sx={{ mt: 1, mb: 2, width: '25ch' }}
              InputProps={{
                endAdornment: <InputAdornment position="end">$</InputAdornment>,
              }}
            />
            
            <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <List dense>
                {departmentEmployees.map(emp => (
                  <ListItem
                    key={emp.id}
                    secondaryAction={
                      selectedEmployees[department.id]?.[emp.id]?.selected && (
                        <TextField
                          type="number"
                          label={t('hoursWorked')}
                          variant="outlined"
                          size="small"
                          value={selectedEmployees[department.id]?.[emp.id]?.hours || ''}
                          onChange={(e) => handleHoursChange(department.id, emp.id, e.target.value)}
                          sx={{ width: '100px' }}
                        />
                      )
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => handleEmployeeSelect(department.id, emp.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedEmployees[department.id]?.[emp.id]?.selected || false}
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
            <Button variant="contained" color="secondary" onClick={() => handleDistribute(department, deptReport.editable_total_tip_out_amount)} sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : t('distributeFor')} {department.name}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
};

export default CreatePool;
