import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, 
  Paper, TextField, Button, Grid, Snackbar, Alert, ButtonGroup 
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword, updateUserLanguage } from '../../api/authApi';
import './Profile.css';

const Profile = () => {
  const { t, i18n } = useTranslation(['common', 'errors', 'pages/managerDashboard', 'pages/profile']);
  const { user, handleTokenUpdate } = useAuth();

  // Edit Profile State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await updateProfile(firstName, lastName);
      handleTokenUpdate(data.token); // Update the token in context
      setSnackbar({ open: true, message: t('updateProfileSuccess', { ns: 'pages/profile' }), severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: t(`errors.${error.message}`) || t('common.somethingWentWrong'), severity: 'error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: t('passwordMismatch', { ns: 'pages/profile' }), severity: 'error' });
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setSnackbar({ open: true, message: t('changePasswordSuccess', { ns: 'pages/profile' }), severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSnackbar({ open: true, message: t(`errors.${error.message}`) || t('common.somethingWentWrong'), severity: 'error' });
    }
  };

  const handleLanguageChange = async (lang) => {
    try {
      await updateUserLanguage(lang);
      i18n.changeLanguage(lang);
      setSnackbar({ open: true, message: t('languageChangeSuccess', { ns: 'pages/profile' }), severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: t(`errors.${error.message}`) || t('common.somethingWentWrong'), severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="profile-container" sx={{ pb: 4 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('profile', { ns: 'pages/managerDashboard' })}
      </Typography>

      <Grid container spacing={4}>
        {/* Left Column: Edit Profile & Language */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>{t('editProfile', { ns: 'pages/profile' })}</Typography>
            <form onSubmit={handleUpdateProfile}>
              <TextField
                fullWidth
                margin="normal"
                label={t('firstName', { ns: 'pages/profile' })}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t('lastName', { ns: 'pages/profile' })}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t('email', { ns: 'pages/profile' })}
                value={user?.email || ''}
                disabled
              />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                {t('save', { ns: 'common' })}
              </Button>
            </form>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>{t('language', { ns: 'pages/profile' })}</Typography>
            <ButtonGroup variant="outlined" aria-label="language selection">
              <Button onClick={() => handleLanguageChange('en')} disabled={i18n.language === 'en'}>English</Button>
              <Button onClick={() => handleLanguageChange('fr')} disabled={i18n.language === 'fr'}>Français</Button>
            </ButtonGroup>
          </Paper>
        </Grid>

        {/* Right Column: Change Password */}
        <Grid item xs={12} md={6} marginBottom={10}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>{t('changePassword', { ns: 'pages/profile' })}</Typography>
            <form onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                margin="normal"
                type="password"
                label={t('currentPassword', { ns: 'pages/profile' })}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                type="password"
                label={t('newPassword', { ns: 'pages/profile' })}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                type="password"
                label={t('confirmNewPassword', { ns: 'pages/profile' })}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                {t('changePassword', { ns: 'pages/profile' })}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;