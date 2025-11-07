import logo from '../assets/logo.png'; // Import the logo
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, Link as MuiLink, Select, MenuItem, FormControl, Fade } from '@mui/material';
import { forgotPassword as apiForgotPassword } from '../api/authApi';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    const { t, i18n } = useTranslation('pages/forgotPassword');
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
        setSuccess('');
        setEmailError(''); // Réinitialiser l'erreur d'e-mail

        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
          setEmailError(emailValidationError);
          return;
        }

        setLoading(true);
        try {
            await apiForgotPassword(email);
            setSuccess(t('successMessage'));
            // Don't redirect immediately, let the user read the message.
            // Maybe redirect after a delay or on a button click.
            // For now, let's plan to redirect to the next step.
            setTimeout(() => {
                 navigate(`/reset-password?email=${email}`);
            }, 3000);
        } catch (err) {
            setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
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
                                      <Typography component="h1" variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }}>
                                        {t("title")}
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
                                        {t("instruction")}
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
                        
                                    <Box
                                        component="form"
                                        onSubmit={handleSubmit}
                                        noValidate
                                        sx={{ mt: 1 }}
                                    >
                                        <TextField
                                            margin="dense"                    required
                    fullWidth
                    id="email"
                    label={t("emailPlaceholder")}
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
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !!success || !!emailError}
                    sx={{ mt: 3, mb: 2 }}
                >
                    {loading
                        ? t('loading', { ns: 'common' })
                        : t("sendButton", { ns: 'pages/forgotPassword' })}
                </Button>
                <MuiLink
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        mt: 2,
                        color: "primary.main",
                        textDecoration: "none",
                    }}
                >
                    {t("backToLogin", { ns: 'common' })}
                </MuiLink>
            </Box>
            </Box>
        </Fade>
    );
};

export default ForgotPasswordPage;
