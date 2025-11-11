import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
} from '@mui/material';
import { setupPassword as apiSetupPassword } from '../api/authApi';

const SetupInvitedPasswordPage = () => {
    const { t } = useTranslation(['pages/setupInvitedPassword', 'pages/signup', 'common', 'errors']);
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
        <Box sx={{ width: "100%", p: { xs: 0, sm: 4 } }}>
            <Typography
                component="h2"
                variant="h4"
                sx={{ fontWeight: 600, mb: 1, color: "#333" }}
            >
                {t("title")}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
                {t("instruction")}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ width: "100%", mt: 2, mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ width: "100%", mt: 2, mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ mt: 1, width: "100%" }}
            >
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
                    size="small"
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
                    size="small"
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
                    size="small"
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
                    size="small"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !!success || !token}
                    sx={{
                        mt: 3,
                        mb: 2,
                        borderRadius: "8px",
                        backgroundColor: "#ad9407ff",
                        color: "white",
                        padding: "12px 0",
                        fontSize: "1rem",
                        fontWeight: 600,
                        "&:hover": { backgroundColor: "#9a7f06ff" },
                    }}
                >
                    {loading ? t('loading', { ns: 'common' }) : t('save', { ns: 'common' })}
                </Button>
            </Box>
        </Box>
    );
};

export default SetupInvitedPasswordPage;