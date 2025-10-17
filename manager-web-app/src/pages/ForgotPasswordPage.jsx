import logo from '../assets/logo.png'; // Import the logo
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper, Alert, Link as MuiLink } from '@mui/material';
import { forgotPassword as apiForgotPassword } from '../api/authApi';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    const { t } = useTranslation('pages/forgotPassword');
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
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <img
                    src={logo}
                    alt="logo"
                    style={{ height: 200, marginBottom: 16 }}
                />
                <Typography component="h1" variant="h5">
                    {t("title")}
                </Typography>
                <Typography sx={{ mt: 2, textAlign: "center", color: "black" }}>
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
                        margin="normal"
                        required
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
                            mt: 2,
                            color: "#1b2646ff",
                            textDecoration: "none",
                        }}
                    >
                        {t("backToLogin", { ns: 'common' })}
                    </MuiLink>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;
