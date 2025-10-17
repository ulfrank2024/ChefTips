import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RuleIcon from '@mui/icons-material/Rule';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PoolIcon from '@mui/icons-material/Pool';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../context/AuthContext.jsx';
import './DashboardPage.css';

const drawerWidth = 240;

const DashboardPage = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard']);
  const { user } = useAuth(); 
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const location = useLocation();
  const mainContentRef = useRef(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: t('overview', { ns: 'pages/managerDashboard' }), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('serverOverview', { ns: 'pages/managerDashboard' }), icon: <AssessmentIcon />, path: '/dashboard/server-overview' },
    { text: t('manageEmployees', { ns: 'pages/managerDashboard' }), icon: <PeopleIcon />, path: '/dashboard/manage-employees' },
    { text: t('manageDepartments', { ns: 'pages/managerDashboard' }), icon: <BusinessIcon />, path: '/dashboard/manage-departments' },
    { text: t('manageCategories', { ns: 'pages/managerDashboard' }), icon: <CategoryIcon />, path: '/dashboard/manage-categories' },
    { text: t('manageRules', { ns: 'pages/managerDashboard' }), icon: <RuleIcon />, path: '/dashboard/manage-rules' },
    { text: t('payPeriodReport', { ns: 'pages/managerDashboard' }), icon: <ReceiptLongIcon />, path: '/dashboard/pay-period-report' },
    { text: t('createPool', { ns: 'pages/managerDashboard' }), icon: <PoolIcon />, path: '/dashboard/create-pool' },
    { text: t('poolHistory', { ns: 'pages/managerDashboard' }), icon: <HistoryIcon />, path: '/dashboard/pool-history' },
    { text: t('profile', { ns: 'pages/managerDashboard' }), icon: <PersonIcon />, path: '/dashboard/profile' },
  ];

  const drawer = (
      <Box
          sx={{
              height: "100%",
              paddingTop: "130px", 
              paddingLeft: "10px",
              paddingRight: "10px",
          }}
      >
          <List>
              {menuItems.map((item) => (
                  <ListItem
                      key={item.text}
                      component={RouterLink}
                      to={item.path}
                      onClick={handleDrawerToggle}
                  sx={{
                        color:'white',
                          backgroundColor:
                              location.pathname === item.path
                                  ? "#ad9407ff"
                                  : "transparent",
                          "&:hover": {
                              backgroundColor:
                                  location.pathname === item.path
                                      ? "#ad9407ff"
                                      : "rgba(255, 255, 255, 0.08)", 
                          },
                      }}
                  >
                      <ListItemIcon
                          sx={{
                            padding:"20px",
                            color: 'black'
                          }}
                      >
                          {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} sx={{ color: 'white' }} /> 
                  </ListItem>
              ))}
          </List>
      </Box>
  );

  return (
      <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <Box
              component="nav"
              sx={{
                  width: { sm: drawerWidth },
                  flexShrink: { sm: 0 },
                  color: "white",
              }}
              aria-label="mailbox folders"
          >
              <Drawer
                  variant="temporary"
                  open={mobileOpen}
                  onClose={handleDrawerToggle}
                  ModalProps={{
                      keepMounted: true,
                  }}
                  sx={{
                      display: { xs: "block", sm: "none" },
                      "& .MuiDrawer-paper": {
                          boxSizing: "border-box",
                          width: drawerWidth,
                          backgroundColor: theme.palette.primary.dark,
                      },
                  }}
              >
                  {drawer}
              </Drawer>
              <Drawer
                  variant="permanent"
                  sx={{
                      display: { xs: "none", sm: "block" },
                      "& .MuiDrawer-paper": {
                          boxSizing: "border-box",
                          width: drawerWidth,
                          backgroundColor: theme.palette.primary.dark,
                      },
                  }}
                  open
              >
                  {drawer}
              </Drawer>
          </Box>
          <Box
              component="main"
              ref={mainContentRef}
              sx={{
                  flexGrow: 1,
                  p: 3,
                  width: { sm: `calc(100% - ${drawerWidth}px)` },
                  paddingTop: "50px",
                  height: "100vh",
                  overflow: "auto",
              }}
          >
              <Outlet />
          </Box>
      </Box>
  );
};

export default DashboardPage;