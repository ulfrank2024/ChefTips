import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert as MuiAlert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { getDefaultTrialDays, updateDefaultTrialDays } from '../api/adminApi';

const SettingsPage = () => {
  const { t } = useTranslation('pages/settings');
  const [defaultTrialDays, setDefaultTrialDays] = useState('');
  const [originalDefaultTrialDays, setOriginalDefaultTrialDays] = useState('');
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchDefaultTrialDays = async () => {
      try {
        const data = await getDefaultTrialDays();
        setDefaultTrialDays(data.default_trial_days);
        setOriginalDefaultTrialDays(data.default_trial_days);
        setCreatedAt(data.created_at);
        setUpdatedAt(data.updated_at);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultTrialDays();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    if (parseInt(defaultTrialDays, 10) !== originalDefaultTrialDays) {
      setOpenConfirmDialog(true);
    } else {
      setSuccess(t('noChanges'));
      setSnackbarOpen(true);
    }
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setOpenConfirmDialog(false);
    try {
      await updateDefaultTrialDays(parseInt(defaultTrialDays, 10));
      setSuccess(t('updateSuccess'));
      setOriginalDefaultTrialDays(parseInt(defaultTrialDays, 10)); // Update original after successful save
      setUpdatedAt(new Date().toISOString()); // Assuming backend updates timestamp
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

  const hasChanges = parseInt(defaultTrialDays, 10) !== originalDefaultTrialDays;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ p: 3, mt: 2, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
          <Box component="form">
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
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('createdAt')}: {formatDate(createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('updatedAt')}: {formatDate(updatedAt)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading || !hasChanges}
              sx={{ mt: 2 }}
            >
              {t('saveButton')}
            </Button>
          </Box>
        </Paper>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity={success ? "success" : "error"} sx={{ width: '100%' }}>
          {success || error}
        </MuiAlert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>{t('confirmUpdateTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('pleaseReviewChanges')}:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary={t('defaultTrialDaysLabel')}
                secondary={`${t('oldValue')}: ${originalDefaultTrialDays}, ${t('newValue')}: ${defaultTrialDays}`}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleConfirmSave} color="primary" variant="contained">
            {t('confirmUpdate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
