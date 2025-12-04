import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
} from "@mui/material";
import { verifyInvitation as apiVerifyInvitation } from "../api/authApi";

const VerifyInvitationPage = () => {
    const { t } = useTranslation(["pages/verifyInvitation", "common", "errors"]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    const [invitationCode, setInvitationCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError(t("errors:EMAIL_MISSING_FROM_URL"));
        }
    }, [email, t]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!invitationCode) {
            setError(t("errors:INVITATION_CODE_REQUIRED"));
            return;
        }

        setLoading(true);
        try {
            const response = await apiVerifyInvitation(email, invitationCode);
            if (response && response.setupToken) {
                setSuccess(t("verificationSuccessMessage"));
                setTimeout(() => {
                    navigate(`/setup-password?token=${response.setupToken}`);
                }, 2000);
            } else {
                setError(t("errors:INVALID_INVITATION_CODE"));
            }
        } catch (err) {
            setError(
                t(`errors:${err.message}`) || t("common:somethingWentWrong")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", p: { xs: 0, sm: 4 } }}>
            <Typography
                component="h1"
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
                    id="invitationCode"
                    label={t("invitationCodePlaceholder")}
                    name="invitationCode"
                    autoFocus
                    value={invitationCode}
                    onChange={(e) => {
                        setInvitationCode(e.target.value);
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : t("verifyButton")}
                </Button>
            </Box>
        </Box>
    );
};

export default VerifyInvitationPage;
