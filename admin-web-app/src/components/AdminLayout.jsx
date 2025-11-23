import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useDrawer } from '../context/DrawerContext'; // Import useDrawer

const drawerWidth = 250;

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { desktopOpen } = useDrawer(); // Consume desktopOpen from context

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box 
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0, // Ajouté pour s'assurer que le flex item se réduit correctement
          paddingTop: "130px", // Equivalent to padding from AppBar + some space
          paddingRight: "24px",
          paddingBottom: "24px",
          paddingLeft: isMobile ? "24px" : "0px", // Ensure 0px paddingLeft on desktop
          width: isMobile ? '100%' : (desktopOpen ? `calc(100vw - ${drawerWidth}px)` : '100vw'), // Adjust width based on sidebar
          marginLeft: isMobile ? 0 : (desktopOpen ? `${drawerWidth}px` : '24px'), // Adjust content position based on sidebar
          transition: theme.transitions.create(['margin-left', 'width', 'padding-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          height: "100vh",
          overflow: "auto",
          position: 'relative',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
