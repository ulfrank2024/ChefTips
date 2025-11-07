import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  TextField, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
dayjs.extend(isBetween);
dayjs.extend(utc);

import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { getPayoutPeriods, createPayoutPeriod, updatePayoutPeriod, deletePayoutPeriod } from '../../api/payoutPeriodApi';

console.log("ManagePayoutPeriods component file loaded.");

const ManagePayoutPeriods = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard']);
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStartDate, setNewPeriodStartDate] = useState(null);
  const [newPeriodEndDate, setNewPeriodEndDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Past', 'Current', 'Future'

  const fetchPeriods = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedPeriods = await getPayoutPeriods();
      setPeriods(fetchedPeriods);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ManagePayoutPeriods: useEffect triggered.");
    console.log("ManagePayoutPeriods: user object:", user);
    if (user?.company_id) {
      console.log("ManagePayoutPeriods: Fetching periods for company_id:", user.company_id);
      fetchPeriods();
    }
  }, [user?.company_id]);

  const getPeriodStatus = (period) => {
    const today = dayjs.utc(dayjs().format('YYYY-MM-DD'));
    const start = dayjs.utc(period.start_date);
    const end = dayjs.utc(period.end_date);

    if (today.isBefore(start, 'day')) return t('futureStatus', { ns: 'pages/managerDashboard' });
    if (today.isAfter(end, 'day')) return t('pastStatus', { ns: 'pages/managerDashboard' });
    return t('currentStatus', { ns: 'pages/managerDashboard' });
  };

  const handleOpenModal = (period = null) => {
    setEditingPeriod(period);
    if (period) {
      setNewPeriodName(period.name);
      setNewPeriodStartDate(dayjs.utc(period.start_date));
      setNewPeriodEndDate(dayjs.utc(period.end_date));
    } else {
      setNewPeriodName('');
      setNewPeriodStartDate(null);
      setNewPeriodEndDate(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPeriod(null);
  };

  const handleSavePeriod = async () => {
    if (!newPeriodName || !newPeriodStartDate || !newPeriodEndDate) {
      showAlert(t('allFieldsRequired', { ns: 'pages/managerDashboard' }), 'error');
      return;
    }

    setLoading(true);
    try {
      const periodData = {
        name: newPeriodName,
        start_date: dayjs(newPeriodStartDate).format('YYYY-MM-DD'),
        end_date: dayjs(newPeriodEndDate).format('YYYY-MM-DD'),
      };

      if (editingPeriod) {
        await updatePayoutPeriod(editingPeriod.id, periodData);
        showAlert(t('periodUpdatedSuccessfully', { ns: 'pages/managerDashboard' }), 'success');
      } else {
        await createPayoutPeriod(periodData);
        showAlert(t('payoutPeriodCreatedSuccessfully', { ns: 'pages/managerDashboard' }), 'success');
      }
      handleCloseModal();
      fetchPeriods();
    } catch (err) {
      showAlert(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (periodId) => {
    if (!window.confirm(t('confirmDeletePeriod', { ns: 'pages/managerDashboard' }))) {
      return;
    }

    setLoading(true);
    try {
      await deletePayoutPeriod(periodId);
      showAlert(t('periodDeletedSuccessfully', { ns: 'pages/managerDashboard' }), 'success');
      fetchPeriods();
    } catch (err) {
      showAlert(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPeriods = periods.filter(period => {
    const status = getPeriodStatus(period);
    if (filterStatus === 'All') return true;
    return status === t(`${filterStatus.toLowerCase()}Status`, { ns: 'pages/managerDashboard' });
  });

  console.log("ManagePayoutPeriods: periods state:", periods);
  console.log("ManagePayoutPeriods: filteredPeriods length:", filteredPeriods.length);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('managePayoutPeriods', { ns: 'pages/managerDashboard' })}
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenModal()}
        sx={{ mb: 3 }}
      >
        {t('createPayoutPeriod', { ns: 'pages/managerDashboard' })}
      </Button>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t('filterByStatus', { ns: 'pages/managerDashboard' })}</InputLabel>
          <Select
            value={filterStatus}
            label={t('filterByStatus', { ns: 'pages/managerDashboard' })}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="All">{t('allStatuses', { ns: 'pages/managerDashboard' })}</MenuItem>
            <MenuItem value="Past">{t('pastStatus', { ns: 'pages/managerDashboard' })}</MenuItem>
            <MenuItem value="Current">{t('currentStatus', { ns: 'pages/managerDashboard' })}</MenuItem>
            <MenuItem value="Future">{t('futureStatus', { ns: 'pages/managerDashboard' })}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : filteredPeriods.length === 0 ? (
        <Typography>{t('noPayoutPeriodsFound', { ns: 'pages/managerDashboard' })}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('nameHeader', { ns: 'pages/managerDashboard' })}</TableCell>
                <TableCell>{t('startDate', { ns: 'pages/managerDashboard' })}</TableCell>
                <TableCell>{t('endDate', { ns: 'pages/managerDashboard' })}</TableCell>
                <TableCell>{t('statusHeader', { ns: 'pages/managerDashboard' })}</TableCell>
                <TableCell align="right">{t('actionsHeader', { ns: 'pages/managerDashboard' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPeriods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.name}</TableCell>
                  <TableCell>{dayjs.utc(period.start_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{dayjs.utc(period.end_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{getPeriodStatus(period)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenModal(period)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePeriod(period.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>{editingPeriod ? t('editPeriod', { ns: 'pages/managerDashboard' }) : t('createPayoutPeriod', { ns: 'pages/managerDashboard' })}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('periodName', { ns: 'pages/managerDashboard' })}
            type="text"
            fullWidth
            variant="standard"
            value={newPeriodName}
            onChange={(e) => setNewPeriodName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={t('startDate', { ns: 'pages/managerDashboard' })}
              value={newPeriodStartDate}
              onChange={(newValue) => setNewPeriodStartDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
            />
            <DatePicker
              label={t('endDate', { ns: 'pages/managerDashboard' })}
              value={newPeriodEndDate}
              onChange={(newValue) => setNewPeriodEndDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleSavePeriod}>{editingPeriod ? t('save', { ns: 'common' }) : t('create', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagePayoutPeriods;