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

    const desktopImage = location.pathname === "/signup" ? "/inscription.png" : (location.pathname === "/forgot-password" || location.pathname === "/reset-password" || location.pathname === "/verify-otp" || location.pathname === "/setup-password" || location.pathname === "/setup-invited-password" ? "/autrepage.png" : (isJoinTeamPage ? "/team.png" : "/login.png"));
    const mobileImage =
        location.pathname === "/signup"
            ? "/inscriptionmob1.png"
            : location.pathname === "/forgot-password" ||
              location.pathname === "/reset-password" ||
              location.pathname === "/verify-otp" ||
              location.pathname === "/setup-password" ||
              location.pathname === "/setup-invited-password"
            ? "/autrepage.png"
            : isJoinTeamPage
            ? "/teamMobile.png"
            : "/loginmobile.png";

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
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/setup-password") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("setupPasswordTitle", { ns: "components/authLayout" })}
                        </Typography>
                    </>
                );
            } else {
                content = null;
            }
        } else if (pathname === "/setup-invited-password") {
            if (isDesktop) {
                content = (
                    <>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{ fontWeight: 700, mb: 2 }}
                            className={animClasses[0]}
                        >
                            {t("setupInvitedPasswordTitle", { ns: "components/authLayout" })}
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
                        xs: "0px 5px 15px rgba(0, 0,0, 0.1)",
                        sm: "none",
                    },
                    position: { xs: "fixed", sm: "relative" },
                    top: 0,
                    left: 0,
                    zIndex: 1,
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
                    height: { xs: "100vh", sm: "100%" },
                    backgroundColor: { xs: "#f0f2f5", sm: "white" },
                    display: "flex",
                    justifyContent: "flex-start", 
                    alignItems: "center",
                    flexDirection: "column",
                    position: "relative",
                    overflowY: "auto",
                    p: { xs: 0, sm: 4 },
                    mt: { xs: '250px', sm: 0 }
                }}
            >


                <Box
                    sx={{
                        position: { xs: "fixed", sm: "absolute" },
                        top: { xs: 250, sm: 40 },
                        left: { xs: 0, sm: 40 },
                        right: { xs: 0, sm: 40 },
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: { xs: "100%", sm: "calc(100% - 80px)" },
                        zIndex: 10,
                        p: { xs: 2, sm: 0 },
                        boxSizing: 'border-box',
                        backgroundColor: { xs: '#f0f2f5', sm: 'transparent' }
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
                        mt: { xs: '100px', sm: 0 }, 
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AuthLayout;