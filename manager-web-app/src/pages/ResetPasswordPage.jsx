import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
} from "@mui/material";
import { resetPassword as apiResetPassword } from "../api/authApi";

const ResetPasswordPage = () => {
    const { t } = useTranslation(["pages/resetPassword", "common", "errors"]);
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
            setError(t("EMAIL_REQUIRED", { ns: 'errors' }));
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
        <Box sx={{ width: "100%", p: { xs: 0, sm: 4 } }}>
            <Typography
                component="h2"
                variant="h4"
                sx={{ fontWeight: 600, mb: 1, color: "#333" }}
            >
                {t("title")}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
                {t("instruction", { email })}
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
                    id="otp"
                    label={t("otpPlaceholder")}
                    name="otp"
                    autoFocus
                    value={formData.otp}
                    onChange={handleChange}
                    inputProps={{ maxLength: 6 }}
                    size="small"
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
                    size="small"
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
                    size="small"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || !!success}
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
                    {loading
                        ? t('loading', { ns: 'common' })
                        : t("resetButton")}
                </Button>
            </Box>
        </Box>
    );
};

export default ResetPasswordPage;