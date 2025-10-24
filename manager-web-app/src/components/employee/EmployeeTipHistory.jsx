 import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { getEmployeeTipHistory } from '../../api/tipApi';
import { useAuth } from '../../context/AuthContext';

const EmployeeTipHistory = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [tipHistory, setTipHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      setError('');
      try {
        const historyData = await getEmployeeTipHistory(user.id);
        setTipHistory(historyData);
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('common.somethingWentWrong'));
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user, t]);

  const { filteredTips, totalAmount, years, months } = useMemo(() => {
    let filtered = tipHistory;
    if (selectedYear) {
      filtered = filtered.filter(tip => new Date(tip.calculated_at).getFullYear() === selectedYear);
    }
    if (selectedMonth) {
      filtered = filtered.filter(tip => new Date(tip.calculated_at).getMonth() + 1 === selectedMonth);
    }
    const total = filtered.reduce((sum, tip) => sum + parseFloat(tip.distributed_amount), 0);
    
    const uniqueYears = Array.from(new Set(tipHistory.map(tip => new Date(tip.calculated_at).getFullYear()))).sort((a, b) => b - a);
    const monthOptions = [
        { label: t('common.allMonths'), value: null }, { label: t('common.january'), value: 1 },
        { label: t('common.february'), value: 2 }, { label: t('common.march'), value: 3 },
        { label: t('common.april'), value: 4 }, { label: t('common.may'), value: 5 },
        { label: t('common.june'), value: 6 }, { label: t('common.july'), value: 7 },
        { label: t('common.august'), value: 8 }, { label: t('common.september'), value: 9 },
        { label: t('common.october'), value: 10 }, { label: t('common.november'), value: 11 },
        { label: t('common.december'), value: 12 },
    ];

    return { filteredTips: filtered, totalAmount: total, years: uniqueYears, months: monthOptions };
  }, [tipHistory, selectedYear, selectedMonth, t]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('employeeTipHistory.title')}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('common.year')}</InputLabel>
              <Select value={selectedYear || ''} label={t('common.year')} onChange={(e) => setSelectedYear(e.target.value)}>
                {years.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('common.month')}</InputLabel>
              <Select value={selectedMonth || ''} label={t('common.month')} onChange={(e) => setSelectedMonth(e.target.value)}>
                {months.map(month => <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: 'primary.main' }}>
        <Typography variant="h6" align="center" sx={{ color: 'white' }}>
          {t('employeeTipHistory.totalTips')}: {totalAmount.toFixed(2)} $
        </Typography>
      </Paper>

      {loadingHistory ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('employeeTipHistory.poolName')}</TableCell>
                <TableCell>{t('employeeTipHistory.period')}</TableCell>
                <TableCell>{t('employeeTipHistory.calculatedOn')}</TableCell>
                <TableCell align="right">{t('employeeTipHistory.amount')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTips.length > 0 ? (
                filteredTips.map((tip) => (
                  <TableRow key={tip.id}>
                    <TableCell>{tip.pool_name}</TableCell>
                    <TableCell>{`${new Date(tip.start_date).toLocaleDateString()} - ${new Date(tip.end_date).toLocaleDateString()}`}</TableCell>
                    <TableCell>{new Date(tip.calculated_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{parseFloat(tip.distributed_amount).toFixed(2)} $</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">{t('employeeTipHistory.noTipsRecorded')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EmployeeTipHistory;