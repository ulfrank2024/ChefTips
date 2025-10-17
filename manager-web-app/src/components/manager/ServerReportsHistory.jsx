import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ServerReportsHistory = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('serverDashboard.reportsHistory')}
      </Typography>
      <Typography variant="body1">
        {t('serverDashboard.reportsHistoryContent')}
      </Typography>
    </Box>
  );
};

export default ServerReportsHistory;