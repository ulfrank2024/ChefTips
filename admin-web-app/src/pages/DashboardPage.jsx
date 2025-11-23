import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GroupIcon from '@mui/icons-material/Group';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { getKpis, getHistoricalKpis } from '../api/adminApi';

const KpiCard = ({ title, value, loading, icon }) => (
    <Paper
        sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)',
            transition: '0.3s',
            '&:hover': {
                boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
            },
        }}
    >
        {icon}
        <Box sx={{ ml: 2 }}>
            <Typography variant="h6" color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
                {loading ? <CircularProgress size={24} /> : value}
            </Typography>
        </Box>
    </Paper>
);

const DashboardPage = () => {
  const { t } = useTranslation('pages/dashboard');
  const [kpis, setKpis] = useState({ mrr: 0, activeCustomers: 0, trialCustomers: 0 });
  const [historicalKpis, setHistoricalKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentKpis, historicalData] = await Promise.all([
          getKpis(),
          getHistoricalKpis()
        ]);
        setKpis(currentKpis);
        setHistoricalKpis(historicalData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
      <Box sx={{ py: 3, backgroundColor: '#f9f9f9' }}>
          <Typography variant="h4" gutterBottom>
              {t("title")}
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
          <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                  <KpiCard
                      title={t("mrr")}
                      value={`${t("currencySymbol")}${kpis.mrr.toFixed(2)}`}
                      loading={loading}
                      icon={<MonetizationOnIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                  />
              </Grid>
              <Grid item xs={12} sm={4}>
                  <KpiCard
                      title={t("activeCustomers")}
                      value={kpis.activeCustomers}
                      loading={loading}
                      icon={<GroupIcon sx={{ fontSize: 40, color: 'secondary.main' }} />}
                  />
              </Grid>
              <Grid item xs={12} sm={4}>
                  <KpiCard
                      title={t("trialCustomers")}
                      value={kpis.trialCustomers}
                      loading={loading}
                      icon={<HourglassEmptyIcon sx={{ fontSize: 40, color: 'error.main' }} />}
                  />
              </Grid>

              <Grid item xs={12}>
                  <Paper sx={{ p: 2, pb: 5, height: 400, boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)" }}>
                      <Typography variant="h6" gutterBottom>
                          {t("historicalKpisTitle")}
                      </Typography>
                      {loading ? (
                          <Box
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              height="100%"
                          >
                              <CircularProgress />
                          </Box>
                      ) : (
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                  data={historicalKpis}
                                  margin={{
                                      top: 5,
                                      right: 30,
                                      left: 20,
                                      bottom: 5,
                                  }}
                              >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                                  <Line
                                      type="monotone"
                                      dataKey="mrr"
                                      stroke="#8884d8"
                                      name={t("mrr")}
                                      unit={t("currencySymbol")}
                                      
                                  />
                                  <Line
                                      type="monotone"
                                      dataKey="activeCustomers"
                                      stroke="#82ca9d"
                                      name={t("activeCustomers")}
                                  />
                                  <Line
                                      type="monotone"
                                      dataKey="trialCustomers"
                                      stroke="#ffc658"
                                      name={t("trialCustomers")}
                                  />
                              </LineChart>
                          </ResponsiveContainer>
                      )}
                  </Paper>
              </Grid>
          </Grid>
      </Box>
  );
};

export default DashboardPage;
