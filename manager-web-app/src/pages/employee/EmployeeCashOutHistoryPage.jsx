import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import dayjs from 'dayjs';
import { getCashOutsByCollector } from '../../api/tipApi';
import { useAuth } from '../../context/AuthContext';

const EmployeeCashOutHistoryPage = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard']);
  const { user } = useAuth();

  const [allCashOuts, setAllCashOuts] = useState([]); // Store all fetched cash outs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); // Use empty string for "All Months"
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const fetchCashOuts = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const cashOuts = await getCashOutsByCollector(user.id, '2020-01-01', dayjs().format('YYYY-MM-DD'));
          setAllCashOuts(cashOuts);
        } else {
          setError(t('userIdNotFound', { ns: 'pages/employeeDashboard' }));
        }
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    fetchCashOuts();
  }, [user, t]);

  const { filteredCashOuts, years, months } = useMemo(() => {
    let currentFilteredCashOuts = allCashOuts;

    // Filter by year
    if (selectedYear) {
      currentFilteredCashOuts = currentFilteredCashOuts.filter(cashOut => new Date(cashOut.service_date).getFullYear() === selectedYear);
    }

    // Filter by month
    if (selectedMonth) {
      currentFilteredCashOuts = currentFilteredCashOuts.filter(cashOut => new Date(cashOut.service_date).getMonth() + 1 === parseInt(selectedMonth));
    }

    const uniqueYears = Array.from(new Set(allCashOuts.map(cashOut => new Date(cashOut.service_date).getFullYear()))).sort((a, b) => b - a);
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

    return { filteredCashOuts: currentFilteredCashOuts.sort((a, b) => new Date(b.service_date) - new Date(a.service_date)), years: uniqueYears, months: allMonths };
  }, [allCashOuts, selectedYear, selectedMonth, t]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'black' }}>
          {t('myCashOutHistory', { ns: 'pages/employeeDashboard' })}
        </Typography>
        <Button variant="contained" onClick={() => setIsFilterModalOpen(true)}>
          {t('filter', { ns: 'common' })}
        </Button>
      </Box>

      {filteredCashOuts.length === 0 ? (
        <Alert severity="info">{t('noCashOuts', { ns: 'pages/employeeDashboard' })}</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('serviceDate', { ns: 'pages/employeeDashboard' })}</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('grossTips', { ns: 'pages/serverDashboard' })}</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('netTips', { ns: 'pages/employeeDashboard' })}</TableCell>
                <TableCell align="right" sx={{ color: 'black', fontWeight: 'bold' }}>{t('finalBalance', { ns: 'pages/employeeDashboard' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCashOuts.map((cashOut, index) => (
                <TableRow 
                  key={index} 
                  // onClick={() => handleCashOutClick(cashOut)} // Add detail view if needed
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell sx={{ color: 'black' }}>{dayjs(cashOut.service_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell sx={{ color: 'black' }}>{Number(cashOut.gross_tips).toFixed(2)} $</TableCell>
                  <TableCell sx={{ color: 'black' }}>{Number(cashOut.net_tips).toFixed(2)} $</TableCell>
                  <TableCell align="right" sx={{ color: 'black' }}>{Number(cashOut.final_balance).toFixed(2)} $</TableCell>
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
    </Box>
  );
};

export default EmployeeCashOutHistoryPage;