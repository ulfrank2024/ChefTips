import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, TextField, Button, Paper, Alert, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { verifyInvitation } from '../api/authApi';
import logo from '../assets/logo.png';

const JoinTeamPage = () => {
  const { t } = useTranslation('pages/joinTeam');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return t('EMAIL_REQUIRED', { ns: 'errors' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return t('INVALID_EMAIL_FORMAT', { ns: 'errors' });
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setEmailError(''); // Réinitialiser l'erreur d'e-mail
    setLoading(true);

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    if (!invitationCode) {
      setError(t('emailAndCodeRequired'));
      setLoading(false);
      return;
    }

    try {
      const response = await verifyInvitation(email, invitationCode);
      // On successful verification, redirect to setup password page with the setupToken
      navigate(`/setup-password?token=${response.setupToken}`);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className="login-paper" sx={{ backgroundColor: "#1b2646ff" }}>
        <img src={logo} alt="logo" style={{ height: 200, marginBottom: 16 }} />
        <Typography component="h1" variant="h5">
          {t('title')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('emailPlaceholder')}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            error={!!emailError}
            helperText={emailError}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="invitationCode"
            label={t('codePlaceholder')}
            type="text"
            id="invitationCode"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !!emailError}
          >
            {loading ? t('loading', { ns: 'common' }) : t('joinButton', { ns: 'pages/joinTeam' })}
          </Button>
          <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ mt: 2, color: "#1b2646ff", textDecoration: "none" }}>
            {t('backToLogin', { ns: 'common' })}
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinTeamPage;
