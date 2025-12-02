import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { verifyInvitation as apiVerifyInvitation } from '../api/authApi';

const VerifyInvitationPage = () => {
    const { t } = useTranslation(['pages/verifyInvitation', 'errors', 'common']);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const code = searchParams.get("code");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyAndRedirect = async () => {
            if (!email || !code) {
                setError(t('missingParamsError'));
                setLoading(false);
                return;
            }

            try {
                setMessage(t('verifyingInvitationMessage'));
                const response = await apiVerifyInvitation(email, code);
                
                if (response && response.setupToken) {
                    setMessage(t('verificationSuccessMessage'));
                    setTimeout(() => {
                        navigate(`/setup-password?token=${response.setupToken}`);
                    }, 2000); // Redirect after a short delay
                } else {
                    setError(t('invalidInvitationError'));
                }
            } catch (err) {
                setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
            } finally {
                setLoading(false);
            }
        };

        verifyAndRedirect();
    }, [email, code, navigate, t]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 3,
            }}
        >
            {loading && <CircularProgress sx={{ mb: 2 }} />}
            {message && <Typography variant="h6" sx={{ mb: 2 }}>{message}</Typography>}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && !message && (
                <Alert severity="info">{t('redirecting')}</Alert>
            )}
        </Box>
    );
};

export default VerifyInvitationPage;
