import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme, useMediaQuery, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDrawer } from '../../context/DrawerContext';
import WelcomeModal from '../WelcomeModal';

const drawerWidth = 240;

const EmployeeDashboardLayout = () => {
  const { mobileOpen, handleDrawerToggle } = useDrawer();
  const { t, i18n } = useTranslation(["common", "pages/employeeDashboard"]);
  const { user, logout } = useAuth(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDashboardContent, setShowDashboardContent] = useState(false);

  useEffect(() => {
    if (user && !sessionStorage.getItem('welcomeShown')) {
      setShowWelcome(true);
      sessionStorage.setItem('welcomeShown', 'true');
    } else {
      setShowDashboardContent(true); // Show dashboard immediately if welcome modal is not needed
    }
  }, [user]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    setShowDashboardContent(true); // Show dashboard once welcome modal is closed
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);


  const menuItems = [
    { text: t('overview', { ns: 'pages/employeeDashboard' }), icon: <DashboardIcon />, path: '/employee/dashboard' },
    { text: t('myReceivedTips', { ns: 'pages/employeeDashboard' }), icon: <AttachMoneyIcon />, path: '/employee/dashboard/received-tips' },
    { text: t('profile', { ns: 'pages/employeeDashboard' }), icon: <PersonIcon />, path: '/employee/dashboard/profile' },
    { text: t('logout', { ns: 'common' }), icon: <ExitToAppIcon />, onClick: () => { logout(); handleDrawerToggle(); navigate('/login'); }, path: '#' }, // Logout button
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
                      onClick={item.onClick ? item.onClick : handleDrawerToggle}
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
          {/* Language Selector */}
          <FormControl variant="outlined" sx={{ m: 2, minWidth: 120, backgroundColor: 'white', borderRadius: 1 }}>
            <InputLabel id="language-select-label">{t('language')}</InputLabel>
            <Select
              labelId="language-select-label"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              label={t('language')}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
            </Select>
          </FormControl>
      </Box>
  );

  return (
    <>
      <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} firstName={user?.first_name} lastName={user?.last_name} companyName={user?.company_name} />
      {showDashboardContent && (
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
                    variant={isMobile ? "temporary" : "permanent"}
                    open={isMobile ? mobileOpen : true}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: "block", sm: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            backgroundColor: 'red',
                            zIndex: theme.zIndex.drawer,
                        },
                    }}
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
      )}
    </>
  );
}

export default EmployeeDashboardLayout;
