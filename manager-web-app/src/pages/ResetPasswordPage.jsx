import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Select,
    MenuItem,
    FormControl,
    Fade
} from "@mui/material";
import { resetPassword as apiResetPassword } from "../api/authApi";
import "./ResetPasswordPage.css";
import logo from '../assets/logo.png'; 

const ResetPasswordPage = () => {
    const { t, i18n } = useTranslation('pages/resetPassword');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    const [formData, setFormData] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError(t("EMAIL_REQUIRED", { ns: 'errors' })); // Use translation key
        }
    }, [email, t]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError(t("PASSWORD_MISMATCH", { ns: 'errors' }));
            return;
        }

        setLoading(true);
        try {
            await apiResetPassword(email, formData.otp, formData.password);
            setSuccess(t('successMessage', { ns: 'pages/resetPassword' }));
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(
                t(err.message, { ns: 'errors' }) || t("somethingWentWrong", { ns: 'common' })
            );
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
                                        {t("instruction", { email })}
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
                    id="otp"
                    label={t("otpPlaceholder")}
                    name="otp"
                    autoFocus
                    value={formData.otp}
                    onChange={handleChange}
                    inputProps={{ maxLength: 6 }}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label={t("newPasswordPlaceholder")}
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
                    label={t("confirmPasswordPlaceholder")}
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !!success}
                    sx={{ mt: 3, mb: 2 }}
                >
                    {loading
                        ? t('loading', { ns: 'common' })
                        : t("resetButton")}
                </Button>
            </Box>
            </Box>
        </Fade>
    );
};

export default ResetPasswordPage;
