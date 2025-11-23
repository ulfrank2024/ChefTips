import React, { useEffect } from 'react';
import i18n from 'i18next'; // Import i18n instance
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme, Fade, IconButton, useMediaQuery, Tooltip, AppBar, Toolbar, Button, Stack
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings'; 
import LanguageIcon from '@mui/icons-material/Language'; // Import LanguageIcon
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import { useDrawer } from '../context/DrawerContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const drawerWidth = 200;

const Sidebar = () => {
  const { t } = useTranslation(['common', 'pages/adminDashboard']);
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mobileOpen, handleDrawerToggle, desktopOpen, handleDesktopToggle } = useDrawer();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (isMobile) handleDrawerToggle();
    navigate('/login');
  };

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    if (isMobile) handleDrawerToggle(); // Close drawer on mobile after language change
  };

  const menuItems = [
    {
        text: t("dashboard", { ns: "pages/adminDashboard" }),
        icon: <DashboardIcon />,
        path: "/",
    },
    {
        text: t("restaurants", { ns: "pages/adminDashboard" }),
        icon: <BusinessIcon />,
        path: "/restaurants",
    },
    {
        text: t("plans", { ns: "pages/adminDashboard" }),
        icon: <CategoryIcon />,
        path: "/plans",
    },
    {
        text: t("settings", { ns: "pages/adminDashboard" }),
        icon: <SettingsIcon />,
        path: "/settings",
    },
    {
        text: t("logout", { ns: "common" }),
        icon: <ExitToAppIcon />,
        onClick: handleLogout,
        path: "/logout", // Use a unique path for logout to prevent navigation issues with '#'
    },
  ];

  const drawerContent = (
      <Box
          sx={{
              height: "100%",
              paddingTop: "130px",
              paddingLeft: "10px",
              paddingRight: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between", // Pushes language switcher to the bottom
          }}
      >
          <List>
              {menuItems.map((item) => (
                  <ListItem
                      key={item.text}
                      component={item.path.startsWith('#') ? 'div' : RouterLink} // Render as div for non-navigational items
                      to={item.path.startsWith('#') ? undefined : item.path}
                      onClick={item.onClick ? item.onClick : (item.path === "#language-switcher" ? (isMobile ? handleDrawerToggle : undefined) : (isMobile ? handleDrawerToggle : undefined))}
                      sx={{
                          color:'white',
                          backgroundColor: location.pathname === item.path ? "#ad9407ff" : "transparent",
                          "&:hover": {
                              backgroundColor: location.pathname === item.path ? "#ad9407ff" : "rgba(255, 255, 255, 0.08)", 
                          },
                      }}
                  >
                      <ListItemIcon sx={{ padding:"20px", color: 'white' }}>
                          {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} sx={{ color: 'white' }} /> 
                  </ListItem>
              ))}
          </List>

          {/* Language Switcher */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Stack direction="row" spacing={1}>
              <Button 
                variant={i18n.language === 'en' ? 'contained' : 'outlined'} 
                onClick={() => handleChangeLanguage('en')}
                sx={{ 
                  minWidth: 'unset', 
                  padding: '5px 10px', 
                  fontSize: '0.8rem',
                  backgroundColor: i18n.language === 'en' ? '#ad9407ff' : 'transparent',
                  color: i18n.language === 'en' ? 'white' : '#ad9407ff',
                  borderColor: '#ad9407ff',
                  '&:hover': {
                    backgroundColor: i18n.language === 'en' ? '#ad9407ff' : 'rgba(173, 148, 7, 0.08)',
                    borderColor: '#ad9407ff',
                  }
                }}
              >
                EN
              </Button>
              <Button 
                variant={i18n.language === 'fr' ? 'contained' : 'outlined'} 
                onClick={() => handleChangeLanguage('fr')}
                sx={{ 
                  minWidth: 'unset', 
                  padding: '5px 10px', 
                  fontSize: '0.8rem',
                  backgroundColor: i18n.language === 'fr' ? '#ad9407ff' : 'transparent',
                  color: i18n.language === 'fr' ? 'white' : '#ad9407ff',
                  borderColor: '#ad9407ff',
                  '&:hover': {
                    backgroundColor: i18n.language === 'fr' ? '#ad9407ff' : 'rgba(173, 148, 7, 0.08)',
                    borderColor: '#ad9407ff',
                  }
                }}
              >
                FR
              </Button>
            </Stack>
          </Box>
      </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ backgroundColor: "#1b2646", padding: "10px", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <img src={logo} alt="logo" style={{ height: isMobile ? 50 : 80, marginRight: 16 }} />
                <Typography variant={isMobile ? "subtitle1" : "h6"} component="div" sx={{ flexGrow: 1, color: "white" }}>
                    {t('adminDashboard', { ns: 'pages/adminDashboard' })}
                </Typography>
                {isMobile && (
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="end"
                        onClick={handleDrawerToggle}
                        sx={{ color: 'white' }}
                    >
                        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
        <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={isMobile ? mobileOpen : desktopOpen}
            onClose={isMobile ? handleDrawerToggle : handleDesktopToggle}
            ModalProps={{
                keepMounted: true, 
            }}
                        sx={{
                            flexShrink: 0,
                            [`& .MuiDrawer-paper`]: {
                                width: drawerWidth,
                                boxSizing: 'border-box',
                                backgroundColor: '#121A30',
                                transition: theme.transitions.create('width', {
                                  easing: theme.transitions.easing.sharp,
                                  duration: theme.transitions.duration.enteringScreen,
                                }),
                                overflowX: 'hidden',
                                ...(!desktopOpen && !isMobile && {
                                  transition: theme.transitions.create('width', {
                                    easing: theme.transitions.easing.sharp,
                                    duration: theme.transitions.duration.leavingScreen,
                                  }),
                                  width: 0,
                                  minWidth: 0, // Ajouté pour s'assurer que la largeur se réduit bien à 0
                                }),
                            },
                        }}        >
            {drawerContent}
        </Drawer>
        {!isMobile && (
          <Tooltip title={desktopOpen ? t('closeMenu', { ns: 'common' }) : t('openMenu', { ns: 'common' })}>
            <IconButton 
              onClick={handleDesktopToggle}
              sx={{
                position: 'fixed',
                top: '110px', 
                left: desktopOpen ? `${drawerWidth + 10}px` : '10px',
                zIndex: theme.zIndex.drawer + 2,
                backgroundColor: '#fff',
                boxShadow: theme.shadows[3],
                '&:hover': {
                  backgroundColor: '#f2f2f2',
                },
                transition: theme.transitions.create('left', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }}
            >
              {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>
        )}
    </Box>
  );
};

export default Sidebar;
