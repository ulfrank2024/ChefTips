import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import WelcomeModal from '../WelcomeModal';

const drawerWidth = 240;

const EmployeeDashboardLayout = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard']);
  const { user } = useAuth(); 
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const location = useLocation();
  const mainContentRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && !sessionStorage.getItem('welcomeShown')) {
      setShowWelcome(true);
      sessionStorage.setItem('welcomeShown', 'true'); // Set flag immediately after showing
    }
  }, [user]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: t('overview', { ns: 'pages/employeeDashboard' }), icon: <DashboardIcon />, path: '/employee/dashboard' },
    { text: t('myReceivedTips', { ns: 'pages/employeeDashboard' }), icon: <AttachMoneyIcon />, path: '/employee/dashboard/received-tips' },
    { text: t('profile', { ns: 'pages/employeeDashboard' }), icon: <PersonIcon />, path: '/employee/dashboard/profile' },
  ];

  // Add collector-specific items if can_cash_out is true
  if (user?.can_cash_out) {
    menuItems.splice(1, 0, { text: t('myCashOutHistory', { ns: 'pages/employeeDashboard' }), icon: <HistoryIcon />, path: '/employee/dashboard/cashout-history' });
  }

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
    <>
      <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} firstName={user?.first_name} lastName={user?.last_name} companyName={user?.company_name} />
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
    </>
  );
};

export default EmployeeDashboardLayout;