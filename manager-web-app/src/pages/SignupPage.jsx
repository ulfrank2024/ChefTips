import logo from '../assets/logo.png';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper, Grid, Link as MuiLink, Alert } from '@mui/material';
import { signup as apiSignup } from '../api/authApi';
import './SignupPage.css';

const SignupPage = () => {
    const { t } = useTranslation('pages/signup');
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // Step state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        companyName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        // Optional: Add validation for step 1 fields here
        if (formData.firstName && formData.lastName && formData.companyName) {
            setError('');
            setStep(2);
        } else {
            setError(t('fillAllFields', { ns: 'common' })); // Assuming you have this translation
        }
    };

    const prevStep = () => {
        setStep(1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setEmailError(''); // Réinitialiser l'erreur d'e-mail

        const emailValidationError = validateEmail(formData.email);
        if (emailValidationError) {
          setEmailError(emailValidationError);
          setLoading(false); // Assurez-vous que le chargement est désactivé si la validation échoue
          return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('PASSWORD_MISMATCH', { ns: 'errors' }));
            return;
        }

        setLoading(true);
        try {
            await apiSignup(
                formData.email,
                formData.password,
                formData.companyName,
                formData.firstName,
                formData.lastName
            );
            navigate(`/verify-otp?email=${formData.email}`);
        } catch (err) {
            setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    padding: 2,
                    marginTop: 4,
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
                    {t("title")} {step === 1 ? '①' : '②'}
                </Typography>
                {error && (
                    <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{ mt: 1 }}
                >
                    {step === 1 && (
                        <>
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                id="firstName"
                                label={t("firstNamePlaceholder")}
                                name="firstName"
                                autoComplete="given-name"
                                autoFocus
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                id="lastName"
                                label={t("lastNamePlaceholder")}
                                name="lastName"
                                autoComplete="family-name"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                id="companyName"
                                label={t("companyNamePlaceholder")}
                                name="companyName"
                                autoComplete="organization"
                                value={formData.companyName}
                                onChange={handleChange}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={nextStep}
                                sx={{ mt: 3, mb: 2 }}
                            >
                                {t("next", { ns: 'common' })}
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                id="email"
                                label={t("email")}
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={formData.email}
                                onChange={(e) => {
                                    handleChange(e);
                                    setEmailError(validateEmail(e.target.value));
                                }}
                                error={!!emailError}
                                helperText={emailError}
                            />
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="password"
                                label={t("password")}
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="confirmPassword"
                                label={t("confirmPassword")}
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
                                <Grid xs={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={prevStep}
                                    >
                                        {t("back", { ns: 'common' })}
                                    </Button>
                                </Grid>
                                <Grid xs={6}>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={loading || !!emailError}
                                    >
                                        {loading ? t("signingUp") : t("button")}
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                    )}

                    <Grid container justifyContent="flex-end">
                        <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
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
                                {t("alreadyAccount")}
                            </MuiLink>
                        </Grid>
                        <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                            <MuiLink
                                component={RouterLink}
                                to="/join-team"
                                variant="body2"
                                sx={{ color: "#ad9407ff", textDecoration: "none" }}
                            >
                                {t("joinTeam", { ns: 'pages/login' })}
                            </MuiLink>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default SignupPage;