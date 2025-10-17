import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress, Alert, Paper
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ServerTipEntry = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [grossTips, setGrossTips] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [netTips, setNetTips] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const gross = parseFloat(grossTips) || 0;
    const adj = parseFloat(adjustments) || 0;
    setNetTips(gross - adj);
  }, [grossTips, adjustments]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user || !user.id || !token) {
      setError(t('error.unauthorizedAccess')); // Need to add this translation key
      setLoading(false);
      return;
    }

    if (!selectedDate || grossTips === '' || adjustments === '') {
      setError(t('serverTipEntry.allFieldsRequired')); // Need to add this translation key
      setLoading(false);
      return;
    }

    try {
      // This endpoint will need to be created in the tip-service
      await axios.post(`${import.meta.env.VITE_TIP_SERVICE_URL}/api/tips/server-entry`, {
        employeeId: user.id,
        date: selectedDate.toISOString().split('T')[0],
        grossTips: parseFloat(grossTips),
        adjustments: parseFloat(adjustments),
        netTips: netTips,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess(t('serverTipEntry.entrySuccess')); // Need to add this translation key
      setGrossTips('');
      setAdjustments('');
      setSelectedDate(dayjs()); // Reset date to today
    } catch (err) {
      console.error('Failed to submit tip entry:', err);
      setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('serverTipEntry.title')}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('common.date')}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
            />
          </LocalizationProvider>

          <TextField
            label={t('serverTipEntry.grossTips')}
            type="number"
            fullWidth
            value={grossTips}
            onChange={(e) => setGrossTips(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label={t('serverTipEntry.adjustments')}
            type="number"
            fullWidth
            value={adjustments}
            onChange={(e) => setAdjustments(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            {t('serverTipEntry.netTips')}: {netTips.toFixed(2)} $
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3, backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('serverTipEntry.submit')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ServerTipEntry;
