import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Link as MuiLink,
    Alert,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { forgotPassword as apiForgotPassword } from "../api/authApi";
import logo from "../assets/logo.png";

const ForgotPasswordPage = () => {
    const { t } = useTranslation("pages/forgotPassword");
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState("");

    const validateEmail = (email) => {
        if (!email) {
            return t("EMAIL_REQUIRED", { ns: "errors" });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return t("INVALID_EMAIL_FORMAT", { ns: "errors" });
        }
        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setEmailError("");

        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            return;
        }

        setLoading(true);
        try {
            const response = await apiForgotPassword(email);
            if (response.success_code === 'SETUP_EMAIL_SENT') {
                setSuccess(t("checkEmailForSetup"));
            } else {
                navigate(`/reset-password?email=${email}`);
            }
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
                        ? t("loading", { ns: "common" })
                        : t("sendButton")}
                </Button>
                <Grid container justifyContent="center">
                    <Grid item>
                        <MuiLink
                            component={RouterLink}
                            to="/login"
                            variant="body2"
                            sx={{ color: "#ad9407ff" }}
                        >
                            {t("backToLogin", { ns: "common" })}
                        </MuiLink>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default ForgotPasswordPage;