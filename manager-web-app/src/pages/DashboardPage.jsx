import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme, Fade, IconButton, useMediaQuery, Tooltip,
  Divider, ListSubheader
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RuleIcon from '@mui/icons-material/Rule';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PoolIcon from '@mui/icons-material/Pool';
import HistoryIcon from '@mui/icons-material/History';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MenuIcon from '@mui/icons-material/Menu';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../context/AuthContext.jsx';
import { useDrawer } from '../context/DrawerContext.jsx';
import WelcomeModal from '../components/WelcomeModal';
import './DashboardPage.css';

const drawerWidth = 240;

const DashboardPage = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard']);
  const { user, logout } = useAuth(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mobileOpen, handleDrawerToggle } = useDrawer();
  const [desktopOpen, setDesktopOpen] = useState(true); // Sidebar state for desktop
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && !sessionStorage.getItem('welcomeShown')) {
      setShowWelcome(true);
      sessionStorage.setItem('welcomeShown', 'true');
    }
  }, [user]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  const handleLogout = () => {
    logout();
    if (isMobile) handleDrawerToggle();
    navigate('/login');
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

    const menuItems = [
        // Groupe Principal
        {
            text: t("overview", { ns: "pages/managerDashboard" }),
            icon: <DashboardIcon />,
            path: "/dashboard",
        },
        {
            text: t("manageEmployees", { ns: "pages/managerDashboard" }),
            icon: <PeopleIcon />,
            path: "/dashboard/manage-employees",
        },
        {
            text: t("declareTips", { ns: "pages/managerDashboard" }),
            icon: <ReceiptLongIcon />,
            path: "/dashboard/declare-tips",
            managerCanCashOut: true,
        },
        { isDivider: true },
        // Groupe Gestion des Pools
        {
            text: t("poolManagement", { ns: "pages/managerDashboard" }),
            isHeader: true,
        },
        {
            text: t("createPool", { ns: "pages/managerDashboard" }),
            icon: <PoolIcon />,
            path: "/dashboard/create-pool",
            indent: true, 
        },
        {
            text: t("poolHistory", { ns: "pages/managerDashboard" }),
            icon: <HistoryIcon />,
            path: "/dashboard/pool-history",
            indent: true,
        },
        { isDivider: true },
        // Groupe Rapports
        {
            text: t("reports", { ns: "pages/managerDashboard" }),
            isHeader: true,
        },
        {
            text: t("serverOverview", { ns: "pages/managerDashboard" }),
            icon: <AssessmentIcon />,
            path: "/dashboard/server-overview",
            indent: true,
        },
        {
            text: t("cashOutHistory", { ns: "pages/managerDashboard" }),
            icon: <HistoryIcon />,
            path: "/dashboard/cashout-history",
            managerCanCashOut: true,
            indent: true,
        },
        {
            text: t("receivedTipsHistory", { ns: "pages/managerDashboard" }),
            icon: <AttachMoneyIcon />,
            path: "/dashboard/received-tips",
            managerCanCashOut: true,
            indent: true,
        },
        { isDivider: true },
        // Groupe Paramètres
        {
            text: t("settings", { ns: "pages/managerDashboard" }),
            isHeader: true,
        },
        {
            text: t("manageRules", { ns: "pages/managerDashboard" }),
            icon: <RuleIcon />,
            path: "/dashboard/manage-rules",
            indent: true,
        },
        {
            text: t("managePayoutPeriods", { ns: "pages/managerDashboard" }),
            icon: <DateRangeIcon />,
            path: "/dashboard/manage-payout-periods",
            indent: true,
        },
        {
            text: t("profile", { ns: "pages/managerDashboard" }),
            icon: <PersonIcon />,
            path: "/dashboard/profile",
            indent: true,
        },
        { isDivider: true },
        // Déconnexion
        {
            text: t("logout", { ns: "common" }),
            icon: <ExitToAppIcon />,
            onClick: handleLogout,
            path: "#",
        },
    ];

    const drawerContent = (
        <Box
            sx={{
                height: "100%",
                paddingTop: "130px",
                paddingLeft: "10px",
                paddingRight: "10px",
            }}
        >
            <List>
                {menuItems
                    .filter(item => !item.managerCanCashOut || user?.can_cash_out)
                    .map((item, index) => {
                        if (item.isDivider) {
                            return <Divider key={`divider-${index}`} sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />;
                        }
                        if (item.isHeader) {
                            return (
                                <ListSubheader key={item.text} sx={{ 
                                    backgroundColor: 'transparent', 
                                    color: 'white', 
                                    lineHeight: '48px', 
                                    fontWeight: 'bold', 
                                    fontSize: '0.9rem',
                                    paddingLeft: '26px' 
                                }}>
                                    {item.text}
                                </ListSubheader>
                            );
                        }
                        return (
                            <ListItem
                                key={item.text}
                                component={RouterLink}
                                to={item.path}
                                onClick={item.onClick ? item.onClick : (isMobile ? handleDrawerToggle : undefined)}
                                sx={{
                                    color: 'white',
                                    backgroundColor: location.pathname === item.path ? "#ad9407ff" : "transparent",
                                    "&:hover": {
                                        backgroundColor: location.pathname === item.path ? "#ad9407ff" : "rgba(255, 255, 255, 0.08)",
                                    },
                                    pl: item.indent ? 4 : 2, // Indent for sub-items
                                }}
                            >
                                <ListItemIcon sx={{ padding:"20px", color: 'black' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} sx={{ color: 'white' }} />
                            </ListItem>
                        );
                    })}
            </List>
        </Box>
    );

  return (
    <>
      <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} firstName={user?.first_name} lastName={user?.last_name} companyName={user?.company_name} />
      <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <Drawer
              variant={isMobile ? "temporary" : "persistent"}
              open={isMobile ? mobileOpen : desktopOpen}
              onClose={isMobile ? handleDrawerToggle : handleDesktopToggle}
              ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                  width: drawerWidth,
                  flexShrink: 0,
                  [`& .MuiDrawer-paper`]: { 
                      width: drawerWidth, 
                      boxSizing: 'border-box',
                      backgroundColor: theme.palette.primary.dark,
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
                      }),
                  },
              }}
          >
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
          <Box
              component="main"
              ref={mainContentRef}
              sx={{
                  flexGrow: 1,
                  paddingTop: "50px",
                  paddingRight: "24px",
                  paddingBottom: "24px",
                  paddingLeft: isMobile ? "24px" : "80px",
                  transition: theme.transitions.create('margin', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
                  marginLeft: isMobile ? 0 : (desktopOpen ? 0 : `-${drawerWidth}px`),
                  ...(desktopOpen && !isMobile && {
                    transition: theme.transitions.create('margin', {
                      easing: theme.transitions.easing.easeOut,
                      duration: theme.transitions.duration.enteringScreen,
                    }),
                  }),
                  width: '100%',
                  height: "100vh",
                  overflow: "auto",
                  position: 'relative',
              }}
          >
              <Outlet />
          </Box>
      </Box>
    </>
  );
};

export default DashboardPage;
