import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { getPayPeriodSummary } from '../../api/tipApi';

const PayPeriodReport = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard', 'components/manager/payPeriodReport']);

  const [selectedRole, setSelectedRole] = useState(''); // New state for selected role
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const predefinedRoles = ['CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // No categories or departments to fetch anymore
      } catch (err) {
        setError(t(`errors.${err.message}`) || t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedRole || !startDate || !endDate) {
      setFormError(t('allFieldsRequired', { ns: 'components/manager/payPeriodReport' }));
      return;
    }
    setLoading(true);
    setFormError('');
    setError('');
    try {
      const data = await getPayPeriodSummary(
        selectedRole,
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      setReportData(data);
    } catch (err) {
      setError(t(`errors.${err.message}`) || t('common.somethingWentWrong'));
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('payPeriodReport', { ns: 'pages/managerDashboard' })}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {formError && <Alert severity="warning" sx={{ mb: 2 }}>{formError}</Alert>}
        <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>{t('selectRole', { ns: 'components/manager/payPeriodReport' })}</InputLabel>
                        <Select
                          value={selectedRole}
                          label={t('selectRole', { ns: 'components/manager/payPeriodReport' })} 
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          {predefinedRoles.map((role) => (
                            <MenuItem key={role} value={role}>{t(role.toLowerCase(), { ns: 'components/manager/manageRules' })}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={t('startDate', { ns: 'common' })}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={t('endDate', { ns: 'common' })}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              sx={{ height: '56px', backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
            >
              {t('generateReport', { ns: 'components/manager/payPeriodReport' })}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('reportSummary', { ns: 'components/manager/payPeriodReport' })}
          </Typography>
          <Typography variant="h4" color="primary">
            {t('totalTipOutAmount', { ns: 'components/manager/payPeriodReport' })}: {parseFloat(reportData.total_tip_out_amount || 0).toFixed(2)} $
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('category', { ns: 'common' })}</TableCell>
                  <TableCell align="right">{t('amount', { ns: 'common' })}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(reportData.category_breakdown).map(([categoryId, amount]) => {
                  const category = categories.find(c => c.id === categoryId);
                  return (
                    <TableRow key={categoryId}>
                      <TableCell>{t(categoryId.toLowerCase(), { ns: 'components/manager/manageRules' })}</TableCell>
                      <TableCell align="right">{parseFloat(amount).toFixed(2)} $</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PayPeriodReport;
