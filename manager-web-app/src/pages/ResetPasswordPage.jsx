import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
} from "@mui/material";
import { resetPassword as apiResetPassword } from "../api/authApi";
import "./ResetPasswordPage.css";
import logo from '../assets/logo.png'; 

const ResetPasswordPage = () => {
    const { t } = useTranslation('pages/resetPassword');
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
    }, [email]);

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
                        margin="normal"
                        required
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
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;
