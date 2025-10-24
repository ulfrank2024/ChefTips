import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, Button, Typography, Container, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// Page Imports
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import JoinTeamPage from './pages/JoinTeamPage';
import SetupInvitedPasswordPage from './pages/SetupInvitedPasswordPage';

// Component & Context Imports
import ManagerProtectedRoute from './components/ManagerProtectedRoute';
import EmployeeProtectedRoute from './components/EmployeeProtectedRoute';
import { useAuth } from './context/AuthContext.jsx';
import { AlertProvider } from './context/AlertContext.jsx';
import AlertDialog from './components/AlertDialog.jsx';
import logo from './assets/logo.png';

// Employee Page Imports

import EmployeeOverview from './components/employee/EmployeeOverview';
import EmployeeProfile from './components/employee/EmployeeProfile';
import EmployeeReceivedTipsPage from './pages/employee/EmployeeReceivedTipsPage';
import EmployeeCashOutHistoryPage from './pages/employee/EmployeeCashOutHistoryPage';
import EmployeeDashboardLayout from './components/employee/EmployeeDashboardLayout'; // New Import

// Manager Component Imports
import Overview from './components/manager/Overview';
import ManageEmployees from './components/manager/ManageEmployees';
import ManageTipOutRules from './components/manager/ManageTipOutRules';
import Profile from './components/manager/Profile';
import ServerOverview from './components/manager/ServerOverview';
import ServerReportsHistory from './components/manager/ServerReportsHistory';
import PayPeriodReport from './components/manager/PayPeriodReport';
import CreatePool from './components/manager/CreatePool';
import PoolHistoryPage from './pages/PoolHistoryPage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';

function App() {
  const { i18n, t } = useTranslation(['common', 'pages/login', 'pages/managerDashboard', 'pages/employeeDashboard']);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getTitle = () => {
      if (location.pathname.startsWith('/dashboard')) return t('title', { ns: 'pages/managerDashboard' });
      if (location.pathname.startsWith('/employee')) return t('title', { ns: 'pages/employeeDashboard' });
      return '';
    };
  
    return (
        <AlertProvider>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ backgroundColor: "#1b2646", padding: "10px", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
                    <img src={logo} alt="logo" style={{ height: 80, marginRight: 16 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "white" }}>
                        {getTitle()}
                    </Typography>
                    {user ? (
                        <>
                            <Button sx={{ color: "white" }} onClick={logout}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Button component={Link} to="/login" sx={{ color: "white" }}>{t("title", { ns: 'pages/login' })}</Button>
                            <Button component={Link} to="/signup" sx={{ color: "white" }}>{t("title", { ns: 'pages/signup' })}</Button>
                        </>
                    )}
                    <Box sx={{ minWidth: 120, marginLeft: 2, backgroundColor:"white", padding:"8px", borderRadius:'10px'}}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="language-select-label" sx={{ color: "white" }}>{t("language")}</InputLabel>
                            <Select
                                labelId="language-select-label"
                                value={i18n.language}
                                label={t("language")}
                                onChange={(e) => changeLanguage(e.target.value)}
                                sx={{ 
                                    ".MuiSelect-select": { color: "white" }, 
                                    ".MuiOutlinedInput-notchedOutline": { borderColor: "black" },
                                    "&:hover .MuiOutlinedInput-notchedInput": { borderColor: "white" },
                                    ".MuiSvgIcon-root": { color: "white" },
                                }}
                            >
                                <MenuItem value="en" sx={{ color: "black" }}>English</MenuItem>
                                <MenuItem value="fr" sx={{ color: "black" }}>Français</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box sx={{ flexGrow: 1, paddingTop: "80px" }}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/verify-otp" element={<VerifyOtpPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/join-team" element={<JoinTeamPage />} />
                    <Route path="/setup-password" element={<SetupInvitedPasswordPage />} />
  
                    <Route element={<ManagerProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardPage />}>
                            <Route index element={<Overview />} />
                            <Route path="manage-employees" element={<ManageEmployees />} />
                            <Route path="manage-rules" element={<ManageTipOutRules />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="server-overview" element={<ServerOverview />} />
                            <Route path="server-reports-history" element={<ServerReportsHistory />} />
                            <Route path="pay-period-report" element={<PayPeriodReport />} />
                            <Route path="create-pool" element={<CreatePool />} />
                            <Route path="pool-history" element={<PoolHistoryPage />} />
                            <Route path="employee-details/:employeeId" element={<EmployeeDetailsPage />} />
                        </Route>
                    </Route>
  
                                      <Route element={<EmployeeProtectedRoute />}>
                                        <Route path="/employee/dashboard" element={<EmployeeDashboardLayout />}>
                                          <Route index element={<EmployeeOverview />} />
                                          <Route path="profile" element={<EmployeeProfile />} />
                                          <Route path="received-tips" element={<EmployeeReceivedTipsPage />} />
                                          <Route path="cashout-history" element={<EmployeeCashOutHistoryPage />} />
                                        </Route>
                                      </Route>  
                    <Route path="/" element={<LoginPage />} /> {/* Default to login if no user and not on a specific route */}
                </Routes>
            </Box>
            <AlertDialog />
        </AlertProvider>
    );
  }
  
  export default App;
