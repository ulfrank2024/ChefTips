import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { getPoolHistory, calculateDistribution } from '../../api/tipApi';
import { useNavigate } from 'react-router-dom';
import './PoolHistory.css';

const PoolHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); // Use empty string for "All Months"
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const fetchPools = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedPools = await getPoolHistory();
      setPools(fetchedPools);
    } catch (err) {
      setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePool = async (poolId) => {
    setLoading(true);
    setError('');
    try {
      await calculateDistribution(poolId);
      await fetchPools(); // Refresh the list after calculation
    } catch (err) {
      setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [t]); // Fetch all pools initially

  const { filteredPools, years, months, totalFilteredAmount } = useMemo(() => {
    let currentFilteredPools = pools;

    // Filter by year
    if (selectedYear) {
      currentFilteredPools = currentFilteredPools.filter(pool => new Date(pool.start_date).getFullYear() === selectedYear);
    }

    // Filter by month
    if (selectedMonth) {
      currentFilteredPools = currentFilteredPools.filter(pool => new Date(pool.start_date).getMonth() + 1 === parseInt(selectedMonth));
    }

    const total = currentFilteredPools.reduce((sum, pool) => sum + parseFloat(pool.total_amount), 0);

    const uniqueYears = Array.from(new Set(pools.map(pool => new Date(pool.start_date).getFullYear()))).sort((a, b) => b - a);
    const allMonths = [
      { label: t("common.allMonths"), value: "" },
      { label: t("common.january"), value: 1 },
      { label: t("common.february"), value: 2 },
      { label: t("common.march"), value: 3 },
      { label: t("common.april"), value: 4 },
      { label: t("common.may"), value: 5 },
      { label: t("common.june"), value: 6 },
      { label: t("common.july"), value: 7 },
      { label: t("common.august"), value: 8 },
      { label: t("common.september"), value: 9 },
      { label: t("common.october"), value: 10 },
      { label: t("common.november"), value: 11 },
      { label: t("common.december"), value: 12 },
    ];

    return { filteredPools: currentFilteredPools.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)), years: uniqueYears, months: allMonths, totalFilteredAmount: total };
  }, [pools, selectedYear, selectedMonth, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
      <Box className="pool-history-container">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" component="h2">
                {t("dashboard.menu.poolHistory")} ({filteredPools.length})
            </Typography>
            <Typography variant="h6" component="span">
                {t("poolHistory.totalAmount")}: {totalFilteredAmount.toFixed(2)} $
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setIsFilterModalOpen(true)}>
              {t('common.filter')}
            </Button>
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              {filteredPools && filteredPools.length > 0 ? (
                  <List>
                      {filteredPools.map((pool) => (
                          <ListItem key={pool.id} secondaryAction={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {!pool.calculated_at && (
                                    <>
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate(`/dashboard/edit-pool/${pool.id}`)}
                                            sx={{ backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
                                        >
                                            {t("common.edit")}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleCalculatePool(pool.id)}
                                            sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' } }}
                                        >
                                            {t("common.calculate")}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/dashboard/pool-details/${pool.id}`)}
                                >
                                    {t("poolHistory.viewDetails")}
                                </Button>
                            </Box>
                          }>
                              <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Typography variant="h6">
                                          {pool.name}
                                      </Typography>
                                      <Chip 
                                        label={pool.calculated_at ? t('poolHistory.statusCalculated') : t('poolHistory.statusNotCalculated')} 
                                        color={pool.calculated_at ? 'success' : 'error'} 
                                        size="small"
                                      />
                                    </Box>
                                  }
                                  secondary={
                                      <>
                                          <Typography
                                              component="span"
                                              variant="body2"
                                          >
                                              <strong>
                                                  {t("poolHistory.totalAmount")}
                                                  :
                                              </strong>{" "}
                                              {pool.total_amount} $
                                          </Typography>
                                          <br />
                                          <Typography
                                              component="span"
                                              variant="body2"
                                          >
                                              <strong>
                                                  {t("poolHistory.period")}:
                                              </strong>{" "}
                                              {new Date(
                                                  pool.start_date
                                              ).toLocaleDateString()}{" "}
                                              -{" "}
                                              {new Date(
                                                  pool.end_date
                                              ).toLocaleDateString()}
                                          </Typography>
                                          {pool.calculated_at && (
                                              <>
                                                  <br />
                                                  <Typography
                                                      component="span"
                                                      variant="body2"
                                                  >
                                                      <strong>
                                                          {t(
                                                              "poolHistory.calculatedOn"
                                                          )}
                                                          :
                                                      </strong>{" "}
                                                      {new Date(
                                                          pool.calculated_at
                                                      ).toLocaleDateString()}
                                                  </Typography>
                                              </>
                                          )}
                                      </>
                                  }
                              />
                          </ListItem>
                      ))}
                  </List>
              ) : (
                  <Typography variant="body2" sx={{ backgroundColor: '#333333', color: 'white', p: 1, borderRadius: 1 }}>
    {t("poolHistory.noPools")}
</Typography>
              )}
          </Paper>

          <Dialog open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('common.filter')}</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
                <InputLabel>{t('common.year')}</InputLabel>
                <Select
                  value={selectedYear}
                  label={t('common.year')}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                <InputLabel>{t('common.month')}</InputLabel>
                <Select
                  value={selectedMonth}
                  label={t('common.month')}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsFilterModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={() => {
                // Apply filter logic here if needed, but useMemo already handles it
                setIsFilterModalOpen(false);
              }}>{t('common.apply')}</Button>
            </DialogActions>
          </Dialog>
      </Box>
  );
};

export default PoolHistory;
