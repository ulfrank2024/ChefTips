import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, FormControl, Select, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AuthLayout = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const isJoinTeamPage = location.pathname === '/join-team';
  const desktopImage = isJoinTeamPage ? "/team.png" : "/login.png";
  const mobileImage = isJoinTeamPage ? "/teamMobile.png" : "/loginmobile.png";

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: { xs: 'column', sm: 'row' } }}>
      {/* Image Panel */}
      <Box
        sx={{
          width: { xs: '100%', sm: '50%' },
          height: { xs: '350px', sm: '100%' }, // Increased height for mobile
          overflow: 'hidden',
          display: 'block', // Always display
          boxShadow: { xs: 'none', sm: '0px 4px 20px rgba(0, 0, 0, 0.2)' }, // Add shadow for desktop
          borderBottomLeftRadius: { xs: '16px', sm: 0 },
          borderBottomRightRadius: { xs: '16px', sm: 0 },
          position: 'relative',
        }}
      >
        <img
          src={isMobile ? mobileImage : desktopImage} // Responsive image source
          alt="Background"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      {/* Form Panel */}
      <Box
        sx={{
          width: { xs: '100%', sm: '50%' },
          height: { xs: 'calc(100vh - 350px - 16px)', sm: '100%' }, // Remaining height for mobile (image + margin)
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflowY: 'auto',
          marginTop: { xs: '16px', sm: 0 }, // Add margin top for mobile
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AuthLayout;
