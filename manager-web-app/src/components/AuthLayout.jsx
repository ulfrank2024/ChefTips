import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
    Box,
    FormControl,
    Select,
    MenuItem,
    useMediaQuery,
    useTheme,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import "./AuthLayout.css";

const LOGO_SRC = logo;

const AuthLayout = () => {
    const { t, i18n } = useTranslation(["pages/login", "components/authLayout"]);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
    const location = useLocation();

    const isJoinTeamPage = location.pathname === "/join-team";

    const desktopImage = location.pathname === "/signup" ? "/inscription.png" : (location.pathname === "/forgot-password" || location.pathname === "/reset-password" || location.pathname === "/verify-otp" ? "/autrepage.png" : (isJoinTeamPage ? "/team.png" : "/login.png"));
    const mobileImage = location.pathname === "/signup" ? "/inscription.png" : (location.pathname === "/forgot-password" || location.pathname === "/reset-password" || location.pathname === "/verify-otp" ? "/autrepage.png" : (isJoinTeamPage ? "/teamMobile.png" : "/loginmobile.png"));

    const getMarketingContent = (pathname, isDesktop) => {
        const animClasses = [
            "fade-in-up",
            "fade-in-up delay-1",
            "fade-in-up delay-2",
            "fade-in-up delay-3",
        ];

        const textContainerSx = {
            width: "100%",
            textAlign: { xs: "center", sm: "left" },
            color: "white",
            position: "relative",
            zIndex: 2,
        };

        let content = null;

        if (pathname === "/login" || pathname === "/") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 800, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("loginTitle", { ns: "components/authLayout" })}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                            }}
                            className="fade-in-background"
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    textAlign: "left",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        lineHeight: 1.6,
                                        opacity: 0.9,
                                        mb: 2,
                                        fontWeight: 500,
                                    }}
                                    className={animClasses[1]}
                                >
                                    {t("loginWelcome", { ns: "components/authLayout" })}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ opacity: 0.8, mb: 1 }}
                                    className={animClasses[2]}
                                >
                                    {t("loginAccessPrompt", { ns: "components/authLayout" })}
                                </Typography>

                                <Box
                                    component="ul"
                                    sx={{
                                        listStylePosition: "inside",
                                        paddingLeft: 0,
                                        margin: "10px 0",
                                        textAlign: "left",
                                        fontWeight: "bold",
                                    }}
                                    className={animClasses[3]}
                                >
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("loginReportDeclaration", { ns: "components/authLayout" })}
                                    </li>
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("loginPoolHistory", { ns: "components/authLayout" })}
                                    </li>
                                </Box>

                                <Typography
                                    variant="body1"
                                    sx={{ mt: 2, fontWeight: "bold" }}
                                    className={animClasses[3]}
                                >
                                    {t("loginCallToAction", { ns: "components/authLayout" })}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/signup") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("signupTitle", { ns: "components/authLayout" })}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                            }}
                            className="fade-in-background"
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    textAlign: "left",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        lineHeight: 1.6,
                                        opacity: 0.9,
                                        mb: 2,
                                        fontWeight: 500,
                                    }}
                                    className={animClasses[1]}
                                >
                                    {t("signupDescription", { ns: "components/authLayout" })}
                                </Typography>

                                <Box
                                    component="ul"
                                    style={{
                                        textAlign: "left",
                                        listStylePosition: "inside",
                                        paddingLeft: 0,
                                        margin: "10px 0",
                                        fontWeight: "bold",
                                    }}
                                    className={animClasses[2]}
                                >
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("signupFeature1", { ns: "components/authLayout" })}
                                    </li>
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("signupFeature2", { ns: "components/authLayout" })}
                                    </li>
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("signupFeature3", { ns: "components/authLayout" })}
                                    </li>
                                </Box>

                                <Typography
                                    variant="body1"
                                    sx={{ mt: 2, fontWeight: "bold" }}
                                    className={animClasses[3]}
                                >
                                    {t("signupCallToAction", { ns: "components/authLayout" })}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/join-team") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("joinTeamTitle", { ns: "components/authLayout" })}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                            }}
                            className="fade-in-background"
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    textAlign: "left",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        lineHeight: 1.6,
                                        opacity: 0.9,
                                        mb: 2,
                                        fontWeight: 500,
                                    }}
                                    className={animClasses[1]}
                                >
                                    {t("joinTeamWelcome", { ns: "components/authLayout" })}
                                </Typography>

                                <Box
                                    component="ul"
                                    style={{
                                        textAlign: "left",
                                        listStylePosition: "inside",
                                        paddingLeft: 0,
                                        margin: "10px 0",
                                        fontWeight: "bold",
                                    }}
                                    className={animClasses[2]}
                                >
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("joinTeamBenefit1", { ns: "components/authLayout" })}
                                    </li>
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("joinTeamBenefit2", { ns: "components/authLayout" })}
                                    </li>
                                    <li style={{ marginBottom: "5px" }}>
                                        {t("joinTeamBenefit3", { ns: "components/authLayout" })}
                                    </li>
                                </Box>

                                <Typography
                                    variant="body1"
                                    sx={{ mt: 2, fontWeight: "bold" }}
                                    className={animClasses[3]}
                                >
                                    {t("joinTeamCallToAction", { ns: "components/authLayout" })}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/forgot-password") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("forgotPasswordTitle", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                lineHeight: 1.6,
                                opacity: 0.8,
                                mb: 2,
                            }}
                            className={animClasses[1]}
                        >
                            {t("forgotPasswordInstructions", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ mt: 2, fontWeight: "bold" }}
                            className={animClasses[2]}
                        >
                            {t("forgotPasswordCallToAction", { ns: "components/authLayout" })}
                        </Typography>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/verify-otp") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("verifyOtpTitle", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                lineHeight: 1.6,
                                opacity: 0.8,
                                mb: 2,
                            }}
                            className={animClasses[1]}
                        >
                            {t("verifyOtpInstructions", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ mt: 2, fontWeight: "bold" }}
                            className={animClasses[2]}
                        >
                            {t("verifyOtpCallToAction", { ns: "components/authLayout" })}
                        </Typography>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/reset-password") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("resetPasswordTitle", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                lineHeight: 1.6,
                                opacity: 0.8,
                                mb: 2,
                            }}
                            className={animClasses[1]}
                        >
                            {t("resetPasswordInstructions", { ns: "components/authLayout" })}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ mt: 2, fontWeight: "bold" }}
                            className={animClasses[2]}
                        >
                            {t("resetPasswordCallToAction", { ns: "components/authLayout" })}
                        </Typography>
                    </>
                );
            } else {
                content = null;
            }
        }

        if (content) {
            return (
                <Box sx={textContainerSx}>

                    {content}
                </Box>
            );
        }

        return null;
    };

    return (
        <Box
            sx={{
                display: "flex",
                height: "100vh",
                backgroundColor: { xs: "#f0f2f5", sm: "white" },
                flexDirection: { xs: "column", sm: "row" },
            }}
        >
            <Box
                sx={{
                    width: { xs: "100%", sm: "50%" },
                    height: { xs: "250px", sm: "100%" },
                    overflow: "hidden",
                    display: "block",
                    borderBottomLeftRadius: { xs: "20px", sm: 0 },
                    borderBottomRightRadius: { xs: "20px", sm: 0 },
                    boxShadow: {
                        xs: "0px 5px 15px rgba(0, 0, 0, 0.1)",
                        sm: "none",
                    },
                    position: "relative",
                }}
            >
                <img
                    src={isDesktop ? desktopImage : mobileImage}
                    alt="Background"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />

                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        flexDirection: "column",
                        p: { xs: 2, sm: 8 },
                    }}
                >
                    {getMarketingContent(location.pathname, isDesktop)}
                </Box>
            </Box>

            <Box
                sx={{
                    width: { xs: "100%", sm: "50%" },
                    height: { xs: "calc(100vh - 200px)", sm: "100%" },
                    backgroundColor: { xs: "#f0f2f5", sm: "white" },
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    overflowY: "auto",
                    p: { xs: 0, sm: 4 },
                }}
            >


                <Box
                    sx={{
                        position: "absolute",
                        top: { xs: 16, sm: 40 },
                        left: { xs: 16, sm: 40 },
                        right: { xs: 16, sm: 40 },
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: { xs: "calc(100% - 32px)", sm: "calc(100% - 80px)" },
                        zIndex: 10,
                    }}
                >
                    <img
                        src={LOGO_SRC}
                        alt="App Logo"
                        style={{ height: "70px" }}
                    />
                    <FormControl size="small">
                        <Select
                            value={i18n.language}
                            onChange={(e) =>
                                i18n.changeLanguage(e.target.value)
                            }
                            sx={{
                                height: { xs: 40, sm: 56 },
                                boxShadow: "none",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    border: "none",
                                },
                                "& .MuiSelect-select": {
                                    paddingRight: "24px",
                                    fontSize: "0.9rem",
                                },
                                "& .MuiSvgIcon-root": { fontSize: "1.2rem" },
                            }}
                        >
                            <MenuItem value="en">EN</MenuItem>
                            <MenuItem value="fr">FR</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box
                    sx={{
                        width: "100%",
                        maxWidth: { xs: "90%", sm: "400px" },
                        my: { xs: 2, sm: 0 },
                        p: { xs: 2, sm: 0 },
                        pt: { xs: "10px", sm: 0 }, // Add padding-top for mobile to account for the logo/language selector bar
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AuthLayout;