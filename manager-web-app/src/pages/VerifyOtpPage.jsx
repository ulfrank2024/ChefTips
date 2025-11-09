import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Link as MuiLink,
} from "@mui/material";
import {
    verifyOtp as apiVerifyOtp,
    resendOtp as apiResendOtp,
} from "../api/authApi";

const VerifyOtpPage = () => {
    const { t } = useTranslation(["pages/verifyOtp", "common", "errors"]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError(t("error.EMAIL_REQUIRED"));
        }
    }, [email, t]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!otp) {
            setError(t("errors:OTP_REQUIRED"));
            return;
        }

        setLoading(true);
        try {
            await apiVerifyOtp(email, otp);
            setSuccess(t("successMessage"));
            setTimeout(() => {
                navigate("/login");
            }, 3000);
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
                    value={otp}
                    onChange={(e) => {
                        setOtp(e.target.value);
                        setError("");
                        setSuccess("");
                    }}
                    inputProps={{ maxLength: 6 }}
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
                    {loading ? "Verifying..." : t("verifyButton")}
                </Button>
                <Box textAlign="center">
                    <MuiLink
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={handleResend}
                        sx={{ color: "#ad9407ff" }}
                    >
                        {t("resendButton")}
                    </MuiLink>
                </Box>
            </Box>
        </Box>
    );
};

export default VerifyOtpPage;