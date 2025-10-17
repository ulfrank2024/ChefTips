import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Link as MuiLink
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { setupPassword as apiSetupPassword } from '../api/authApi';
import logo from '../assets/logo.png';

const SetupInvitedPasswordPage = () => {
  const { t } = useTranslation(['pages/setupInvitedPassword', 'pages/signup', 'pages/resetPassword', 'common', 'errors']);
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
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src={logo} alt="logo" style={{ height: 200, marginBottom: 16 }} />
        <Typography component="h1" variant="h5">
          {t('title')}
        </Typography>
        <Typography sx={{ mt: 2, textAlign: "center", color: "black" }}>
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
            margin="normal"
            required
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
          <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2, color: "#1b2646ff", textDecoration: "none" }}>
            {t('backToLogin', { ns: 'common' })}
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupInvitedPasswordPage;
