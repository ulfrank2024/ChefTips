import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { getKpis } from '../api/adminApi';

const KpiCard = ({ title, value, loading }) => (
  <Paper sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="h6" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h4" fontWeight="bold">
      {loading ? '...' : value}
    </Typography>
  </Paper>
);

const DashboardPage = () => {
  const { t } = useTranslation('pages/dashboard');
  const [kpis, setKpis] = useState({ mrr: 0, activeCustomers: 0, trialCustomers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const data = await getKpis();
        setKpis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <KpiCard title="MRR" value={`$${kpis.mrr.toFixed(2)}`} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard title="Active Customers" value={kpis.activeCustomers} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard title="Trial Customers" value={kpis.trialCustomers} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
