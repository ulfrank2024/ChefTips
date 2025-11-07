import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, Link as MuiLink, Select, MenuItem, FormControl, Fade
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { setupPassword as apiSetupPassword } from '../api/authApi';
import logo from '../assets/logo.png';

const SetupInvitedPasswordPage = () => {
  const { t, i18n } = useTranslation(['pages/setupInvitedPassword', 'pages/signup', 'pages/resetPassword', 'common', 'errors']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('noTokenError'));
    }
  }, [token, t]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError(t('noTokenError'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('PASSWORD_MISMATCH', { ns: 'errors' }));
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.password) {
      setError(t('fillAllFields', { ns: 'common' }));
      return;
    }

    setLoading(true);
    try {
      await apiSetupPassword(token, formData.password, formData.firstName, formData.lastName);
      setSuccess(t('successMessage'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ width: '100%', maxWidth: '400px', p: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '16px', backgroundColor: 'white', position: 'relative' }}>
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mb: 2, height: { xs: 60, sm: 150 } }}>
                      <img src={logo} alt="logo" style={{ height: '100%' }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography component="h1" variant="h5" sx={{ textAlign: 'center', fontSize: { xs: '1.5rem', sm: '1.5rem' } }}>
                      {t('title')}
                    </Typography>
                    <FormControl>
                      <Select
                        value={i18n.language}
                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                        sx={{
                          height: { xs: 30, sm: 40 },
                          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiSelect-select': { paddingRight: '24px', fontSize: { xs: '0.8rem', sm: '1rem' } },
                          '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', sm: '1.5rem' } },
                        }}
                      >
                        <MenuItem value="en" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>English</MenuItem>
                        <MenuItem value="fr" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Français</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
                    {t('instruction')}
                  </Typography>
            
                  {error && (
                    <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                      {error} 
                    </Alert>
                  )}
                  {success && (
                    <Alert severity="success" sx={{ width: "100%", mt: 2 }}>
                      {success}
                    </Alert>
                  )}
            
                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                      margin="dense"          required
          fullWidth
          id="firstName"
          label={t('firstNamePlaceholder', { ns: 'pages/signup' })}
          name="firstName"
          autoFocus
          value={formData.firstName}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="lastName"
          label={t('lastNamePlaceholder', { ns: 'pages/signup' })}
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label={t('newPasswordPlaceholder', { ns: 'pages/resetPassword' })}
          type="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label={t('confirmPasswordPlaceholder', { ns: 'pages/resetPassword' })}
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !!success || !token}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? t('loading', { ns: 'common' }) : t('save', { ns: 'common' })}
        </Button>
        <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ display: 'block', textAlign: 'center', mt: 2, color: "primary.main", textDecoration: "none" }}>
          {t('backToLogin', { ns: 'common' })}
        </MuiLink>
      </Box>
          </Box>
        </Fade>
      );};

export default SetupInvitedPasswordPage;
