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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./LoginPage.css";
import logo from "../assets/logo.png";

const LoginPage = () => {
    const { t } = useTranslation("pages/login"); // i18n est géré dans AuthLayout
    const { login, selectCompanyAndLogin, logout } = useAuth();
    const navigate = useNavigate();

    // ... (Garder tous les useState et fonctions de validation/submit/handleCompanySelection intacts) ...
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

    // State for multi-company selection
    const [isCompanySelectOpen, setIsCompanySelectOpen] = useState(false);
    const [memberships, setMemberships] = useState([]);
    const [tempUserId, setTempUserId] = useState(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [companySelectError, setCompanySelectError] = useState("");

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
            const result = await login(email, password);

            if (result.success_code === "multiple_companies_choose_one") {
                setTempUserId(result.userId);
                setMemberships(result.memberships);
                setIsCompanySelectOpen(true);
            } else {
                const userRole = (result.role || "employee").toLowerCase();
                if (userRole === 'manager' || userRole === 'gerant') {
                    navigate("/dashboard", { replace: true });
                } else if (userRole === 'admin') {
                    setError(t("ADMIN_NOT_ALLOWED", { ns: "errors" }));
                    logout();
                } else {
                    navigate("/employee/dashboard", { replace: true });
                }
            }
        } catch (err) {
            setError(
                t(err.message, { ns: "errors" }) ||
                    t("somethingWentWrong", { ns: "common" })
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCompanySelection = async () => {
        if (!selectedCompanyId) {
            setCompanySelectError(t("selectCompanyRequired"));
            return;
        }
        setLoading(true);
        setCompanySelectError("");
        try {
            const user = await selectCompanyAndLogin(
                tempUserId,
                selectedCompanyId
            );
            const userRole = (user.role || "employee").toLowerCase();
            if (userRole === 'manager' || userRole === 'gerant') {
                navigate("/dashboard", { replace: true });
            } else if (userRole === 'admin') {
                setCompanySelectError(t("ADMIN_NOT_ALLOWED", { ns: "errors" }));
                logout();
            } else {
                navigate("/employee/dashboard", { replace: true });
            }
            setIsCompanySelectOpen(false);
        } catch (err) {
            setCompanySelectError(
                t(err.message, { ns: "errors" }) ||
                    t("somethingWentWrong", { ns: "common" })
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        // Ce Box remplace tout l'ancien conteneur de structure
        <Box sx={{ width: "100%", p: { xs: 0, sm: 4 } }}>
            {/* Logo mobile (Visible uniquement sur les petits écrans) */}


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

            {/* Le sélecteur de langue a été déplacé dans AuthLayout */}

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

                {/* Liens "Don't have an account?" et "Join team" */}
                <Grid container justifyContent="center" sx={{ mt: { xs: 1, sm: 2 } }}>
                    <Grid item>
                        <Typography variant="body2" sx={{ color: "#666" }}>
                            {t("noAccount")}{" "}
                            <MuiLink
                                component={RouterLink}
                                to="/signup"
                                className="lien"
                                sx={{ color: "#ad9407ff" }}
                            >
                                {t("signUpHere")}
                            </MuiLink>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ textAlign: "center", mt: { xs: 0.5, sm: 1 } }}>
                        <MuiLink
                            component={RouterLink}
                            to="/join-team"
                            className="lien"
                            sx={{ color: "#ad9407ff" }}
                        >
                            {t("joinTeam")}
                        </MuiLink>
                    </Grid>
                </Grid>
            </Box>

            {/* Le dialogue de sélection de compagnie reste inchangé */}
            <Dialog
                open={isCompanySelectOpen}
                onClose={() => setIsCompanySelectOpen(false)}
                disableEscapeKeyDown
            >
                <DialogTitle>{t("selectCompanyTitle")}</DialogTitle>
                <DialogContent>
                    {companySelectError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {companySelectError}
                        </Alert>
                    )}
                    <Typography>{t("selectCompanyMessage")}</Typography>
                    <FormControl fullWidth margin="normal">
                        <Select
                            value={selectedCompanyId}
                            label={t("company")}
                            onChange={(e) =>
                                setSelectedCompanyId(e.target.value)
                            }
                        >
                            {memberships.map((membership) => (
                                <MenuItem
                                    key={membership.company_id}
                                    value={membership.company_id}
                                >
                                    {membership.company_name} ({membership.role}
                                    )
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCompanySelection} disabled={loading}>
                        {loading
                            ? t("loggingIn")
                            : t("select", { ns: "common" })}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LoginPage;
