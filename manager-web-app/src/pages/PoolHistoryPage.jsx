import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPools, getPoolDetails } from '../api/tipApi';
import { getCompanyEmployees } from '../api/authApi'; // To get employee names
import PoolDetailsModal from '../components/manager/PoolDetailsModal'; // Import the modal
import {
  Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Grid, Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

const PoolHistoryPage = () => {
  const { t } = useTranslation(['common']);
  const [pools, setPools] = useState([]);
  const [employees, setEmployees] = useState([]); // State for employees
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // State for filters
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const fetchPools = async (start, end) => {
    try {
      setLoading(true);
      setError('');
      const data = await getPools(
        start ? start.format('YYYY-MM-DD') : null,
        end ? end.format('YYYY-MM-DD') : null
      );
      setPools(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [poolsData, employeesData] = await Promise.all([
          getPools(), // Initial fetch without filters
          getCompanyEmployees()
        ]);
        setPools(poolsData);
        setEmployees(employeesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleApplyFilter = () => {
    fetchPools(filterStartDate, filterEndDate);
  };

  const handleRowClick = async (poolId) => {
    try {
      setDetailLoading(true);
      setIsModalOpen(true);
      const details = await getPoolDetails(poolId);
      setSelectedPool(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPool(null);
  };

  if (loading && pools.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('poolHistoryTitle', { ns: 'pages/managerDashboard', count: pools.length })}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker 
                label={t('startDate', { ns: 'common' })}
                value={filterStartDate}
                onChange={setFilterStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />} 
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker 
                label={t('endDate', { ns: 'common' })}
                value={filterEndDate}
                onChange={setFilterEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />} 
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" onClick={handleApplyFilter} sx={{ height: '56px' }}>
              {t('applyFilter', { ns: 'common' })}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Département</TableCell>
              <TableCell align="center">{t('startDate')}</TableCell>
              <TableCell align="center">{t('endDate')}</TableCell>
              <TableCell align="center">{t('creationDate')}</TableCell>
              <TableCell align="center">{t('recipientCount')}</TableCell>
              <TableCell align="center">{t('totalDistributedHours')}</TableCell>
              <TableCell align="center">{t('ratePerHour')}</TableCell>
              <TableCell align="center">Montant Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pools.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun pool trouvé.
                </TableCell>
              </TableRow>
            ) : (
              pools.map((pool) => {
                const totalAmount = Number(pool.total_amount);
                const totalDistributedHours = Number(pool.total_distributed_hours);
                const ratePerHour = totalDistributedHours > 0 ? totalAmount / totalDistributedHours : 0;
                return (
                  <TableRow
                    key={pool.id}
                    hover
                    onClick={() => handleRowClick(pool.id)}
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {pool.department_name}
                    </TableCell>
                    <TableCell align="center">{dayjs(pool.start_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell align="center">{dayjs(pool.end_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell align="center">{dayjs(pool.created_at).format('YYYY-MM-DD HH:mm')}</TableCell>
                    <TableCell align="center">{pool.recipient_count || 0}</TableCell>
                    <TableCell align="center">{totalDistributedHours.toFixed(2)}</TableCell>
                    <TableCell align="center">{ratePerHour.toFixed(2)} $</TableCell>
                    <TableCell align="center">{totalAmount.toFixed(2)} $</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PoolDetailsModal 
        open={isModalOpen}
        onClose={handleCloseModal}
        pool={detailLoading ? null : selectedPool}
        employees={employees}
      />
    </Box>
  );
};

export default PoolHistoryPage;
