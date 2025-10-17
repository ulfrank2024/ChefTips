import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Typography, Button, Box, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, IconButton, CssBaseline, useTheme 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png'; 
import './DashboardPage.css'; 

const drawerWidth = 240;

const EmployeeDashboardPage = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard']);
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
    { text: t('overview', { ns: 'pages/employeeDashboard' }), icon: <DashboardIcon />, path: '/employee/dashboard' },
    { text: t('myReceivedTips', { ns: 'pages/employeeDashboard' }), icon: <HistoryIcon />, path: '/employee/dashboard/received-tips' },
    { text: t('profile', { ns: 'pages/employeeDashboard' }), icon: <PersonIcon />, path: '/employee/dashboard/profile' },
  ];

  const drawer = (
    <Box sx={{ height: "100%", paddingTop: "130px", paddingLeft: "10px", paddingRight: "10px" }}> 
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
      {/* AppBar is now in App.jsx */}
      <Box
        component="nav"
        sx={{
            width: { sm: drawerWidth },
          
            color: "white",
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
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
          p: 3, // Add padding back here, consistent with manager
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          // ml: { sm: `${drawerWidth}px` }, // Remove left margin, it's handled by width and flexGrow
          height: '100vh', 
          overflow: 'auto', 
          paddingTop: "50px", // Apply manager's main content padding
        }}
      >
        {/* Toolbar is no longer needed here as AppBar is in App.jsx */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default EmployeeDashboardPage;
