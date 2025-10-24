import React, { useEffect } from 'react';
import { Box, Typography, Grow, Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/logo.png';

const contentStyle = {
  width: 400,
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

const WelcomeModal = ({ open, onClose, firstName, lastName, companyName }) => {
  const { t, i18n } = useTranslation('common');
  const ready = i18n.isInitialized;

  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        onClose();
      }, 3000); // Close after 3 seconds
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
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                  {t('hello')}, {firstName} {lastName}!
                </Typography>
                <Typography variant="h6">
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
