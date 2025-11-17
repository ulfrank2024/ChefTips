import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import './AuthLayout.css';

const AuthLayout = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const desktopImage = '/login.png';
  const mobileImage = '/loginmobile.png';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: { xs: '#f0f2f5', sm: 'white' },
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      {/* Image Section */}
      <Box
        sx={{
          width: { xs: '100%', sm: '50%' },
          height: { xs: '250px', sm: '100vh' },
          position: { xs: 'fixed', sm: 'relative' },
          backgroundImage: `url(${isDesktop ? desktopImage : mobileImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          p: { xs: 2, sm: 4 },
          color: 'white',
          borderBottomLeftRadius: { xs: '20px', sm: 0 },
          borderBottomRightRadius: { xs: '20px', sm: 0 },
          boxShadow: { xs: '0px 5px 15px rgba(0, 0,0, 0.1)', sm: 'none' },
          zIndex: 1,
        }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Hide on mobile */}
          <Typography variant="h4" fontWeight="bold">
            Admin Panel
          </Typography>
          <Typography variant="body1">
            Welcome to the ChefTips administration panel.
          </Typography>
        </Box>
      </Box>

      {/* Form Section */}
      <Box
        sx={{
          width: { xs: '100%', sm: '50%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', sm: 'center' },
          p: { xs: 2, sm: 4 },
          mt: { xs: '250px', sm: 0 }, // Margin top for mobile to push content below image
          flexGrow: 1,
        }}
      >
        {/* Header for mobile */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            mb: 2,
          }}
        >
          <img src={logo} alt="ChefTips Logo" style={{ width: '80px', height: 'auto' }} /> {/* Reduced size */}
          <FormControl size="small">
            <Select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="fr">FR</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Header for desktop */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute',
            top: 20,
            right: 20,
            left: 20,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <img src={logo} alt="ChefTips Logo" style={{ width: '120px', height: 'auto' }} />
          <FormControl size="small">
            <Select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="fr">FR</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 400, mt: { xs: 2, sm: 0 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;