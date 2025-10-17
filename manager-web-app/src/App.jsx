import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import EmployeeOverview from './components/employee/EmployeeOverview';
import EmployeeProfile from './components/employee/EmployeeProfile';
import EmployeeReceivedTipsPage from './pages/employee/EmployeeReceivedTipsPage'; // New Import
import CategorySelectionPage from './pages/CategorySelectionPage'; // New Import

import ServerDashboardPage from './pages/ServerDashboardPage';
import CollectorServerOverview from "./components/server/ServerOverview.jsx";
import ServerReportHistoryPage from './pages/server/ServerReportHistoryPage'; // New Import

// Manager Component Imports
import Overview from './components/manager/Overview';
import ManageEmployees from './components/manager/ManageEmployees';
import ManageDepartments from './components/manager/ManageDepartments';
import ManageCategories from './components/manager/ManageCategories';
import ManageTipOutRules from './components/manager/ManageTipOutRules';
import Profile from './components/manager/Profile';
import ServerOverview from './components/manager/ServerOverview';
import ServerReportsHistory from './components/manager/ServerReportsHistory';
import PayPeriodReport from './components/manager/PayPeriodReport'; // New Import
import CreatePool from './components/manager/CreatePool'; // New Import
import PoolHistoryPage from './pages/PoolHistoryPage'; // New Import
import EmployeeDetailsPage from './pages/EmployeeDetailsPage'; // New Import

function App() {
  const { i18n, t } = useTranslation(['common', 'pages/login', 'pages/managerDashboard', 'pages/employeeDashboard']);
  const { user, logout } = useAuth();
  const location = useLocation();

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
                          <Button component={Link} to="/dashboard" sx={{ color: "white" }}>{t("title", { ns: 'pages/managerDashboard' })}</Button>
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
                                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
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
                  <Route path="/login" element={user ? (user.role === 'manager' ? <Navigate to="/dashboard" /> : user.department_type === 'RECEIVER' ? <Navigate to="/employee/dashboard" /> : <Navigate to="/server/select-category" />) : <LoginPage />} />
                  <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
                  <Route path="/verify-otp" element={<VerifyOtpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/join-team" element={<JoinTeamPage />} />
                  <Route path="/setup-password" element={<SetupInvitedPasswordPage />} />

                  <Route element={<ManagerProtectedRoute />}>
                      <Route path="/dashboard" element={<DashboardPage />}>
                          <Route index element={<Overview />} />
                          <Route path="manage-employees" element={<ManageEmployees />} />
                          <Route path="manage-departments" element={<ManageDepartments />} />
                          <Route path="manage-categories" element={<ManageCategories />} />
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
                    <Route path="/employee/dashboard" element={<EmployeeDashboardPage />}>
                      <Route index element={<EmployeeOverview />} />
                      <Route path="profile" element={<EmployeeProfile />} />
                      <Route path="received-tips" element={<EmployeeReceivedTipsPage />} />
                    </Route>

                    <Route path="/server/dashboard" element={<ServerDashboardPage />}>
                      <Route index element={<CollectorServerOverview />} />
                      <Route path="history" element={<ServerReportHistoryPage />} />
                      <Route path="profile" element={<EmployeeProfile />} />
                    </Route>
                    <Route path="/server/select-category" element={<CategorySelectionPage />} />
                  </Route>

                  <Route path="/" element={<Navigate to={user ? (user.role === 'manager' ? "/dashboard" : user.department_type === 'RECEIVER' ? "/employee/dashboard" : "/server/select-category") : "/login"} />} />
              </Routes>
          </Box>
          <AlertDialog />
      </AlertProvider>
  );
}

export default App;



