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
import { signup as apiSignup } from "../api/authApi";

const SignupPage = () => {
    const { t } = useTranslation("pages/signup");
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (formData.firstName && formData.lastName && formData.companyName) {
            setError("");
            setStep(2);
        } else {
            setError(t("fillAllFields", { ns: "common" }));
        }
    };

    const prevStep = () => {
        setStep(1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setEmailError("");

        const emailValidationError = validateEmail(formData.email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t("PASSWORD_MISMATCH", { ns: "errors" }));
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
            setError(
                t(err.message, { ns: "errors" }) ||
                    t("somethingWentWrong", { ns: "common" })
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography
                component="h6"
                variant="h4"
                sx={{ fontWeight: 800, mb: 1, color: "#333" }}
            >
                {t("title")} {step === 1 ? '①' : '②'}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
                {step === 1 ? t("subtitle") : t("subtitle_step2", { ns: "pages/signup" })}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ width: "100%", mt: 2, mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ mt: 1, width: "100%" }}
            >
                {step === 1 && (
                    <>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="firstName"
                            label={t("firstNamePlaceholder")}
                            name="firstName"
                            autoComplete="given-name"
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
                            label={t("lastNamePlaceholder")}
                            name="lastName"
                            autoComplete="family-name"
                            value={formData.lastName}
                            onChange={handleChange}
                            size="small"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="companyName"
                            label={t("companyNamePlaceholder")}
                            name="companyName"
                            autoComplete="organization"
                            value={formData.companyName}
                            onChange={handleChange}
                            size="small"
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={nextStep}
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
                            {t("next", { ns: "common" })}
                        </Button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <TextField
                            margin="normal"
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
                            size="small"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={t("password")}
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            size="small"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label={t("confirmPassword")}
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            size="small"
                        />
                        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading || !!emailError}
                                    sx={{
                                        borderRadius: "8px",
                                        backgroundColor: "#ad9407ff",
                                        color: "white",
                                        padding: "12px 0",
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        "&:hover": { backgroundColor: "#9a7f06ff" },
                                    }}
                                >
                                    {loading ? t("signingUp") : t("button")}
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={prevStep}
                                >
                                    {t("back", { ns: "common" })}
                                </Button>
                            </Grid>
                        </Grid>
                    </>
                )}

                <Grid container justifyContent="center">
                    <Grid item>
                        <MuiLink
                            component={RouterLink}
                            to="/login"
                            variant="body2"
                            sx={{ color: "#ad9407ff" }}
                        >
                            {t("alreadyAccount")}
                        </MuiLink>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default SignupPage;