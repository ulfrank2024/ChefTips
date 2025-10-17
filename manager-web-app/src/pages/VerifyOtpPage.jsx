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
    Link as MuiLink,
} from "@mui/material";
import {
    verifyOtp as apiVerifyOtp,
    resendOtp as apiResendOtp,
} from "../api/authApi";
import "./VerifyOtpPage.css";
import logo from '../assets/logo.png'; // Import the logo

const VerifyOtpPage = () => {
    const { t } = useTranslation(['pages/verifyOtp', 'common', 'errors']);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError(t("error.EMAIL_REQUIRED")); // Use translation key
        }
    }, [email]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!otp) {
            setError(t("errors:OTP_REQUIRED")); // Corrected translation key
            return;
        }

        setLoading(true);
        try {
            await apiVerifyOtp(email, otp);
            setSuccess(t("successMessage"));
            setTimeout(() => {
                navigate("/login");
            }, 3000); // Redirect to login after 3 seconds
        } catch (err) {
            setError(
                t(`errors:${err.message}`) || t("common:somethingWentWrong")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        try {
            await apiResendOtp(email);
            setSuccess(t("resendSuccessMessage"));
        } catch (err) {
            setError(
                t(`errors:${err.message}`) || t("common:somethingWentWrong")
            );
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
                        value={otp}
                        onChange={(e) => {
                            setOtp(e.target.value);
                            setError("");
                            setSuccess("");
                        }}
                        inputProps={{ maxLength: 6 }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading || !!success} // Disable if loading or on success
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? "Verifying..." : t("verifyButton")}
                    </Button>
                    <Box textAlign="center">
                        <MuiLink
                            component="button"
                            type="button" 
                            variant="body2"
                            onClick={handleResend}
                        >
                            {t("resendButton")}
                        </MuiLink>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default VerifyOtpPage;
