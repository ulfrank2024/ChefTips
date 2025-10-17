import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Typography, Button, Box, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, IconButton, CssBaseline, useTheme 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext.jsx';
import './DashboardPage.css'; 

const drawerWidth = 240;

const ServerDashboardPage = () => {
  const { t } = useTranslation(['common', 'pages/serverDashboard']);
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate(); // Added
  const mainContentRef = useRef(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }

    // Redirection logic for category selection
    if (user && user.role === 'server') {
      const storedCategory = localStorage.getItem('selectedCategory');
      const today = dayjs().format('YYYY-MM-DD');

      if (!storedCategory) {
        navigate('/server/select-category');
        return;
      }

      const parsedCategory = JSON.parse(storedCategory);

      if (parsedCategory.date !== today || parsedCategory.userId !== user.id) {
        navigate('/server/select-category');
        return;
      }
    }
  }, [location.pathname, user, navigate]); // Added user and navigate to dependencies

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: t('overview', { ns: 'pages/serverDashboard' }), icon: <DashboardIcon />, path: '/server/dashboard' },
    { text: t('reportHistory', { ns: 'pages/serverDashboard' }), icon: <HistoryIcon />, path: '/server/dashboard/history' },
    { text: t('profile', { ns: 'pages/employeeDashboard' }), icon: <PersonIcon />, path: '/server/dashboard/profile' },
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
      <Box
        component="nav"
        sx={{
            width: { sm: drawerWidth },
            flexShrink: { sm: 0 }
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          height: '100vh', 
          overflow: 'auto', 
          paddingTop: "50px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ServerDashboardPage;
