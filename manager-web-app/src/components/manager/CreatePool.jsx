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
import { getPayPeriodSummary, createPool } from '../../api/tipApi';
import { getCompanyEmployees } from '../../api/authApi';

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
  const [selectedRole, setSelectedRole] = useState(''); // New state for selected role

  const predefinedRoles = ['CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const emps = await getCompanyEmployees();
      setEmployees(emps);
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
        predefinedRoles.map(role => getPayPeriodSummary(role, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')))
      );
      const augmentedReports = reports.map((r, index) => ({
        ...r,
        role: predefinedRoles[index],
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

  const handleDistribute = async (role, totalAmount) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const distributions = Object.entries(selectedEmployees[role] || {})
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
        role: role,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        distributions: finalDistributions,
        totalAmount: totalAmount // Add this line
      });
      setSuccess(t('DISTRIBUTION_SUCCESS', { ns: 'common' }));
      // Reset selections for the current department
      setSelectedEmployees(prev => ({...prev, [role]: {}}));
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
        const role = predefinedRoles[index];
        const roleEmployees = employees.filter(emp => emp.role === role);

        return (
          <Paper key={role} elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">{t(role.toLowerCase(), { ns: 'components/manager/manageRules' })}</Typography>
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
                {roleEmployees.map(emp => (
                  <ListItem
                    key={emp.id}
                    secondaryAction={
                      selectedEmployees[role]?.[emp.id]?.selected && (
                        <TextField
                          type="number"
                          label={t('hoursWorked')}
                          variant="outlined"
                          size="small"
                          value={selectedEmployees[role]?.[emp.id]?.hours || ''}
                          onChange={(e) => handleHoursChange(role, emp.id, e.target.value)}
                          sx={{ width: '100px' }}
                        />
                      )
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => handleEmployeeSelect(role, emp.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedEmployees[role]?.[emp.id]?.selected || false}
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
            <Button variant="contained" color="secondary" onClick={() => handleDistribute(role, deptReport.editable_total_tip_out_amount)} sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : t('distributeFor')} {t(role.toLowerCase(), { ns: 'components/manager/manageRules' })}
            </Button>
          </Paper>
        );
      })}
    </Box>
  );
};

export default CreatePool;