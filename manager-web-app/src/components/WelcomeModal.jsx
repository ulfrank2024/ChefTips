import React, { useEffect } from 'react';
import { Box, Typography, Grow, Fade, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/logo.png';

const WelcomeModal = ({ open, onClose, firstName, lastName, companyName }) => {
  const { t, i18n } = useTranslation('common');
  const ready = i18n.isInitialized;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const contentStyle = {
    width: isMobile ? '90%' : 400,
    maxWidth: isMobile ? 'none' : 400, // Ensure it doesn't get too wide on larger screens
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 4,
    textAlign: 'center'
  };

  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        onClose();
      }, 2000); // Close after 1 second
    }
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <Fade in={open} timeout={300}>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: (theme) => theme.zIndex.modal, // Ensure it's on top
      }}>
        <Grow in={open} timeout={500}>
          <Box sx={contentStyle}>
            {ready && (
              <>
                <Box
                  component="img"
                  src={Logo}
                  alt="App Logo"
                  sx={{ width: 120, height: 120, mb: 2, objectFit: 'contain' }}
                />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', fontSize: isMobile ? '1.5rem' : '2.125rem' }}>
                  {t('hello')}, {firstName} {lastName}!
                </Typography>
                <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  {t('welcomeTo', { companyName: companyName })}
                </Typography>
              </>
            )}
          </Box>
        </Grow>
      </Box>
    </Fade>
  );
};

export default WelcomeModal;
