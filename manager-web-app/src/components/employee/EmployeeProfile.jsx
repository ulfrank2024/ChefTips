import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, TextField, Button, Grid, Snackbar, Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateUserLanguage, updateProfile } from '../../api/authApi'; // Import updateUserLanguage and updateProfile
import i18n from 'i18next'; // Import i18n instance
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'; // Import new MUI components

const EmployeeProfile = () => {
  const { t } = useTranslation(['common', 'errors', 'pages/profilePage', 'pages/employeeDashboard']);
  const { user, setUser, handleTokenUpdate } = useAuth(); // Get setUser and handleTokenUpdate from useAuth

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: t('passwordMismatch', { ns: 'pages/profilePage' }), severity: 'error' });
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setSnackbar({ open: true, message: t('changePasswordSuccess', { ns: 'pages/profilePage' }), severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSnackbar({ open: true, message: t(`error.${error.message}`) || t('somethingWentWrong', { ns: 'common' }), severity: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await updateProfile(firstName, lastName);
      if (response.token) {
        handleTokenUpdate(response.token);
      }
      setSnackbar({ open: true, message: t('profileUpdateSuccess', { ns: 'pages/profilePage' }), severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: t(`error.${error.message}`) || t('somethingWentWrong', { ns: 'common' }), severity: 'error' });
    }
  };

  const handleChangeLanguage = async (lng) => {
    try {
      await updateUserLanguage(lng);
      i18n.changeLanguage(lng);
      // Update user context with new language
      setUser(prevUser => ({ ...prevUser, preferred_language: lng }));
      setSnackbar({ open: true, message: t('languageChangeSuccess', { ns: 'pages/profilePage' }), severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: t(`error.${error.message}`) || t('somethingWentWrong', { ns: 'common' }), severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              {t("profileTitle", { ns: "pages/employeeDashboard" })}
          </Typography>

          <Grid container spacing={4}>
              {/* User Information */}
              <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                          {t("profileInfo", { ns: "pages/profilePage" })}
                      </Typography>
                      <TextField
                          fullWidth
                          margin="normal"
                          label={t('firstName', { ns: 'pages/profilePage' })}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                      />
                      <TextField
                          fullWidth
                          margin="normal"
                          label={t('lastName', { ns: 'pages/profilePage' })}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                      />
                      <TextField
                          fullWidth
                          margin="normal"
                          label={t('email', { ns: 'pages/profilePage' })}
                          value={user?.email || ""}
                          disabled
                      />
                      <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSaveProfile}>
                          {t('save', { ns: 'common' })}
                      </Button>
                      <FormControl fullWidth margin="normal">
                          <InputLabel id="language-select-label">{t('language', { ns: 'common' })}</InputLabel>
                          <Select
                              labelId="language-select-label"
                              value={i18n.language}
                              label={t('language', { ns: 'common' })}
                              onChange={(e) => handleChangeLanguage(e.target.value)}
                          >
                              <MenuItem value="en">English</MenuItem>
                              <MenuItem value="fr">Français</MenuItem>
                          </Select>
                      </FormControl>
                  </Paper>
              </Grid>

              {/* Change Password */}
              <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                          {t("changePassword", { ns: "pages/profilePage" })}
                      </Typography>
                      <form onSubmit={handleChangePassword}>
                          <TextField
                              fullWidth
                              margin="normal"
                              type="password"
                              label={t("currentPassword", {
                                  ns: "pages/profilePage",
                              })}
                              value={currentPassword}
                              onChange={(e) =>
                                  setCurrentPassword(e.target.value)
                              }
                          />
                          <TextField
                              fullWidth
                              margin="normal"
                              type="password"
                              label={t("newPassword", {
                                  ns: "pages/profilePage",
                              })}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <TextField
                              fullWidth
                              margin="normal"
                              type="password"
                              label={t("confirmNewPassword", {
                                  ns: "pages/profilePage",
                              })}
                              value={confirmPassword}
                              onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                              }
                          />
                          <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              sx={{ mt: 2 }}
                          >
                              {t("changePasswordButton", {
                                  ns: "pages/profilePage",
                              })}
                          </Button>
                      </form>
                  </Paper>
              </Grid>
          </Grid>

          <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
              <Alert
                  onClose={handleCloseSnackbar}
                  severity={snackbar.severity}
                  sx={{ width: "100%" }}
              >
                  {snackbar.message}
              </Alert>
          </Snackbar>
      </Box>
  );
};

export default EmployeeProfile;