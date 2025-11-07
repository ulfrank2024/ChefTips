import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Button, Alert, Link as MuiLink, Select, MenuItem, FormControl, Fade } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { verifyInvitation } from '../api/authApi';
import logo from '../assets/logo.png';

const JoinTeamPage = () => {
  const { t, i18n } = useTranslation('pages/joinTeam');
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
                  {error && (
                    <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                      margin="dense"          required
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
        <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ display: 'block', textAlign: 'center', mt: 2, color: "primary.main", textDecoration: "none" }}>
          {t('backToLogin', { ns: 'common' })}
        </MuiLink>
      </Box>
          </Box>
        </Fade>
      );};

export default JoinTeamPage;
