import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { getDefaultTrialDays, updateDefaultTrialDays } from '../api/adminApi';

const SettingsPage = () => {
  const { t } = useTranslation('pages/settings');
  const [defaultTrialDays, setDefaultTrialDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchDefaultTrialDays = async () => {
      try {
        const data = await getDefaultTrialDays();
        setDefaultTrialDays(data.default_trial_days);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultTrialDays();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateDefaultTrialDays(parseInt(defaultTrialDays, 10));
      setSuccess(t('updateSuccess'));
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label={t('defaultTrialDaysLabel')}
            type="number"
            value={defaultTrialDays}
            onChange={(e) => setDefaultTrialDays(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!error}
            helperText={error}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {t('saveButton')}
          </Button>
        </Box>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={success ? "success" : "error"} sx={{ width: '100%' }}>
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
