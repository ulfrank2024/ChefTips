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
    Select,
    MenuItem,
    FormControl,
    Fade
} from "@mui/material";
import {
    verifyOtp as apiVerifyOtp,
    resendOtp as apiResendOtp,
} from "../api/authApi";
import "./VerifyOtpPage.css";
import logo from '../assets/logo.png'; // Import the logo

const VerifyOtpPage = () => {
    const { t, i18n } = useTranslation(['pages/verifyOtp', 'common', 'errors']);
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
    }, [email, t]);

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
                    margin="dense"
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
            </Box>
        </Fade>
    );
};

export default VerifyOtpPage;
