import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  CssBaseline, useTheme, Fade, IconButton, useMediaQuery
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
import DateRangeIcon from '@mui/icons-material/DateRange'; // Import new icon
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Import AttachMoneyIcon
import MenuIcon from '@mui/icons-material/Menu';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
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
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    logout();
    handleDrawerToggle(); // Close drawer if open on mobile
    navigate('/login');
  };

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const menuItems = [
      {
          text: t("overview", { ns: "pages/managerDashboard" }),
          icon: <DashboardIcon />,
          path: "/dashboard",
      },
      {
          text: t("serverOverview", { ns: "pages/managerDashboard" }),
          icon: <AssessmentIcon />,
          path: "/dashboard/server-overview",
      },
      {
          text: t("manageEmployees", { ns: "pages/managerDashboard" }),
          icon: <PeopleIcon />,
          path: "/dashboard/manage-employees",
      },
      {
          text: t("manageRules", { ns: "pages/managerDashboard" }),
          icon: <RuleIcon />,
          path: "/dashboard/manage-rules",
      },
      {
          text: t("managePayoutPeriods", { ns: "pages/managerDashboard" }),
          icon: <DateRangeIcon />,
          path: "/dashboard/manage-payout-periods",
      },
      {
          text: t("createPool", { ns: "pages/managerDashboard" }),
          icon: <PoolIcon />,
          path: "/dashboard/create-pool",
      },
      {
          text: t("poolHistory", { ns: "pages/managerDashboard" }),
          icon: <HistoryIcon />,
          path: "/dashboard/pool-history",
      },
      {
          text: t("declareTips", { ns: "pages/managerDashboard" }),
          icon: <ReceiptLongIcon />,
          path: "/dashboard/declare-tips",
          managerCanCashOut: true,
      },
      {
          text: t("cashOutHistory", { ns: "pages/managerDashboard" }),
          icon: <HistoryIcon />,
          path: "/dashboard/cashout-history",
          managerCanCashOut: true,
      },
      {
          text: t("receivedTipsHistory", { ns: "pages/managerDashboard" }),
          icon: <AttachMoneyIcon />,
          path: "/dashboard/received-tips",
          managerCanCashOut: true,
      },
      {
          text: t("profile", { ns: "pages/managerDashboard" }),
          icon: <PersonIcon />,
          path: "/dashboard/profile",
      },
      {
          text: t("logout", { ns: "common" }),
          icon: <ExitToAppIcon />,
          onClick: handleLogout,
          path: "#",
      }, // Logout button
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
              {menuItems
                  .filter(item => {
                      if (item.managerCanCashOut) {
                          return user?.can_cash_out;
                      }
                      return true;
                  })
                  .map((item) => (
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
                          backgroundColor: theme.palette.primary.dark,
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
    </>
  );
};

export default DashboardPage;
