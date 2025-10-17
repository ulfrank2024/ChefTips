import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import dayjs from 'dayjs';
import { getEmployeeReceivedTips, getPoolSummary } from '../../api/tipApi';
import { useAuth } from '../../context/AuthContext';

const EmployeeReceivedTipsPage = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard']);
  const { user } = useAuth();

  const [allReceivedTips, setAllReceivedTips] = useState([]); // Store all fetched tips
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); // Use empty string for "All Months"
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTipDetails, setSelectedTipDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    const fetchReceivedTips = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const tips = await getEmployeeReceivedTips(user.id);
          setAllReceivedTips(tips);
        } else {
          setError(t('userIdNotFound', { ns: 'pages/employeeDashboard' }));
        }
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedTips();
  }, [user, t]);

  const { filteredTips, years, months } = useMemo(() => {
    let currentFilteredTips = allReceivedTips;

    // Filter by year
    if (selectedYear) {
      currentFilteredTips = currentFilteredTips.filter(tip => new Date(tip.start_date).getFullYear() === selectedYear);
    }

    // Filter by month
    if (selectedMonth) {
      currentFilteredTips = currentFilteredTips.filter(tip => new Date(tip.start_date).getMonth() + 1 === parseInt(selectedMonth));
    }

    const uniqueYears = Array.from(new Set(allReceivedTips.map(tip => new Date(tip.start_date).getFullYear()))).sort((a, b) => b - a);
    const allMonths = [
      { label: t("allMonths"), value: "" },
      { label: t("january"), value: 1 },
      { label: t("february"), value: 2 },
      { label: t("march"), value: 3 },
      { label: t("april"), value: 4 },
      { label: t("may"), value: 5 },
      { label: t("june"), value: 6 },
      { label: t("july"), value: 7 },
      { label: t("august"), value: 8 },
      { label: t("september"), value: 9 },
      { label: t("october"), value: 10 },
      { label: t("november"), value: 11 },
      { label: t("december"), value: 12 },
    ];

    return { filteredTips: currentFilteredTips.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)), years: uniqueYears, months: allMonths };
  }, [allReceivedTips, selectedYear, selectedMonth, t]);

  const handleTipClick = async (tip) => {
    setLoadingDetails(true);
    setDetailsError('');
    try {
      const poolSummary = await getPoolSummary(tip.pool_id);
      setSelectedTipDetails({ ...tip, ...poolSummary });
      setIsDetailsModalOpen(true);
    } catch (err) {
      setDetailsError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'black' }}>
          {t('myReceivedTips', { ns: 'pages/employeeDashboard' })}
        </Typography>
        <Button variant="contained" onClick={() => setIsFilterModalOpen(true)}>
          {t('filter', { ns: 'common' })}
        </Button>
      </Box>

      {filteredTips.length === 0 ? (
        <Alert severity="info">{t('noReceivedTips', { ns: 'pages/employeeDashboard' })}</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('period', { ns: 'common' })}</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('department', { ns: 'common' })}</TableCell>
                <TableCell align="right" sx={{ color: 'black', fontWeight: 'bold' }}>{t('amount', { ns: 'common' })}</TableCell>
                <TableCell align="right" sx={{ color: 'black', fontWeight: 'bold' }}>{t('hoursWorked', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTips.map((tip, index) => (
                <TableRow 
                  key={index} 
                  onClick={() => handleTipClick(tip)} 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell sx={{ color: 'black' }}>{dayjs(tip.start_date).format('YYYY-MM-DD')} - {dayjs(tip.end_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell sx={{ color: 'black' }}>{tip.department_name}</TableCell>
                  <TableCell align="right" sx={{ color: 'black' }}>{Number(tip.distributed_amount).toFixed(2)} $</TableCell>
                  <TableCell align="right" sx={{ color: 'black' }}>{Number(tip.hours_worked).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('filter', { ns: 'common' })}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
            <InputLabel>{t('year', { ns: 'common' })}</InputLabel>
            <Select
              value={selectedYear}
              label={t('year', { ns: 'common' })}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>{t('month', { ns: 'common' })}</InputLabel>
            <Select
              value={selectedMonth}
              label={t('month', { ns: 'common' })}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map(month => (
                <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFilterModalOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={() => {
            setIsFilterModalOpen(false);
          }}>{t('apply', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>

      {/* Tip Details Modal */}
      <Dialog open={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tipDetailsTitle', { ns: 'pages/employeeDashboard' })}</DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <CircularProgress />
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : selectedTipDetails ? (
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: 'background.paper' }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'black' }}>
                {t('tipDetailsTitle', { ns: 'pages/employeeDashboard' })}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('department', { ns: 'common' })}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{selectedTipDetails.department_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('period', { ns: 'common' })}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{dayjs(selectedTipDetails.start_date).format('YYYY-MM-DD')} - {dayjs(selectedTipDetails.end_date).format('YYYY-MM-DD')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('creationDate', { ns: 'common' })}:</Typography>
                  <Typography variant="body1" sx={{ color: 'black' }}>{dayjs(selectedTipDetails.pool_created_at).format('YYYY-MM-DD HH:mm')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('recipientCount', { ns: 'common' })}:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 0.5, color: 'black' }} />
                    <Typography variant="body1" sx={{ color: 'black' }}>{selectedTipDetails.recipient_count || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('totalPoolAmount', { ns: 'common' })}:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 0.5, color: 'success.main' }} />
                    <Typography variant="h6" color="success.main">{Number(selectedTipDetails.total_amount).toFixed(2)} $</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="black">{t('totalDistributedHours', { ns: 'common' })}:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 0.5, color: 'info.main' }} />
                    <Typography variant="h6" color="info.main">{Number(selectedTipDetails.total_distributed_hours).toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="black">{t('ratePerHour', { ns: 'common' })}:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 0.5, color: 'primary.main' }} />
                    <Typography variant="h5" color="primary.main">{((Number(selectedTipDetails.total_amount) || 0) / (Number(selectedTipDetails.total_distributed_hours) || 1)).toFixed(2)} $</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsModalOpen(false)}>{t('close', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeReceivedTipsPage;