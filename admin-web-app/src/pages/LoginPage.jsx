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
import { useAuth } from "../context/AuthContext.jsx";
import "./LoginPage.css";

const LoginPage = () => {
    const { t } = useTranslation(["pages/login", "common", "errors"]);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState("");

    const validateEmail = (email) => {
        if (!email) {
            return t("email_required", { ns: "errors" });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return t("invalid_email_format", { ns: "errors" });
        }
        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setEmailError("");

        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            await login(email, password);
            navigate("/", { replace: true });
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
        <Box sx={{ width: "100%", p: { xs: 0, sm: 4 } }}>
            <Typography
                component="h2"
                variant="h4"
                sx={{ fontWeight: 600, mb: 1, color: "#333" }}
            >
                {t("welcomeBack")}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
                {t("loginToContinue")}
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
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label={t("email")}
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
                    sx={{ mb: { xs: 1, sm: 2 } }}
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: { xs: 0.5, sm: 1 } }}
                    size="small"
                />

                <Grid container justifyContent="flex-end" sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Grid item>
                        <MuiLink
                            component={RouterLink}
                            to="/forgot-password"
                            className="lien"
                            variant="body2"
                            sx={{ color: "#ad9407ff" }}
                        >
                            {t("forgotPassword")}
                        </MuiLink>
                    </Grid>
                </Grid>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                        mt: { xs: 1, sm: 1 },
                        mb: { xs: 2, sm: 3 },
                        borderRadius: "8px",
                        backgroundColor: "#ad9407ff",
                        color: "white",
                        padding: { xs: "8px 0", sm: "12px 0" },
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        fontWeight: 600,
                        "&:hover": { backgroundColor: "#9a7f06ff" },
                    }}
                    disabled={loading || !!emailError}
                >
                    {loading ? t("loggingIn") : t("button")}
                </Button>
            </Box>
        </Box>
    );
};

export default LoginPage;
