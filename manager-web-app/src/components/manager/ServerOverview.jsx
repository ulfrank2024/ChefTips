import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, TableContainer, TextField, Button, CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext is two levels up
import axios from 'axios';

const ServerOverview = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard', 'errors']);
  const { user, token, isLoading } = useAuth(); // Get token from useAuth
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [serversData, setServersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchServerOverview = async () => {
    console.log("ServerOverview: fetchServerOverview called.");
    console.log("ServerOverview: isLoading =", isLoading);
    console.log("ServerOverview: user =", user);
    console.log("ServerOverview: user.company_id =", user?.company_id);
    console.log("ServerOverview: user.token =", token); // Log token directly

    if (isLoading) { // Don't fetch if auth is still loading
      console.log("ServerOverview: Auth is still loading, returning.");
      return;
    }
    if (!user || !user.company_id || !token) { // Check token directly
      console.log("ServerOverview: User or company_id or token is missing, setting error.");
      setError(t('COMPANY_ID_NOT_FOUND', { ns: 'errors' })); // Utiliser le namespace errors
      return;
    }

    if (!startDate || !endDate) {
      setError(t('DATE_RANGE_REQUIRED', { ns: 'errors' })); // Nouvelle clé de traduction
      return;
    }

    setLoading(true);
    setError('');
    try {
      // This endpoint will need to be created in the tip-service
      const response = await axios.get(`${import.meta.env.VITE_TIP_SERVICE_URL}/api/tips/server-overview`, {
        params: {
          companyId: user.company_id,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Ensure response.data is an array, if not, set to empty array
      if (!Array.isArray(response.data)) {
        console.error('API did not return an array for server overview:', response.data);
        setServersData([]);
        setError(t('somethingWentWrong', { ns: 'common' })); // Or a more specific error
      } else {
        setServersData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch server overview:', err);
      // Log the actual error response from the API
      if (err.response && err.response.data && err.response.data.error) {
        setError(t(err.response.data.error, { ns: 'errors' })); // Utiliser le namespace errors
      } else {
        setError(t('somethingWentWrong', { ns: 'common' })); // Utiliser le namespace common
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user && user.company_id && token) { // Check token directly
      fetchServerOverview();
    }
  }, [user, startDate, endDate, isLoading, token]); // Add token to dependencies

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('overview', { ns: 'pages/managerDashboard' })}
      </Typography>

      {isLoading && <CircularProgress />} {/* Display loading indicator for auth */}
      {!isLoading && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('startDate', { ns: 'common' })}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label={t('endDate', { ns: 'common' })}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
            <Button variant="contained" onClick={fetchServerOverview} disabled={loading}>
              {t('filter', { ns: 'common' })}
            </Button>
          </Box>

          {loading && <CircularProgress />}
          {error && <Typography color="error">{error}</Typography>}

          {!loading && !error && serversData.length === 0 && (
            <Typography variant="body1">{t('noDataFound', { ns: 'pages/managerDashboard' })}</Typography>
          )}

          {!loading && !error && serversData.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('employee', { ns: 'common' })}</TableCell>
                    <TableCell>{t('date', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('grossTips', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('adjustments', { ns: 'common' })}</TableCell>
                    <TableCell align="right">{t('netTips', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serversData.map((server) => (
                    <TableRow key={server.employee_id + server.date}>
                      <TableCell>{server.employee_name}</TableCell>
                      <TableCell>{new Date(server.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{server.gross_tips.toFixed(2)}</TableCell>
                      <TableCell align="right">{server.adjustments.toFixed(2)}</TableCell>
                      <TableCell align="right">{server.net_tips.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default ServerOverview;