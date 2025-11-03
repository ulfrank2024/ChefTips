import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    getPayoutPeriods,
    createPayoutPeriod,
    updatePayoutPeriod,
    deletePayoutPeriod
} from '../api/payoutPeriodApi';
import {
    Box, Typography, CircularProgress, Alert, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Grid, Button, TextField,
    IconButton, Tooltip, useTheme, useMediaQuery, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

const PayoutPeriodsPage = () => {
    const { t } = useTranslation(['common', 'pages/managerDashboard']);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Confirmation Dialog State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [periodToDelete, setPeriodToDelete] = useState(null);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const data = await getPayoutPeriods();
            setPeriods(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const handleCreatePeriod = async (e) => {
        e.preventDefault();
        if (!name || !startDate || !endDate) {
            setError("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await createPayoutPeriod({
                name,
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
            });
            setSuccess('Payout period created successfully!');
            // Reset form
            setName('');
            setStartDate(null);
            setEndDate(null);
            // Refresh list
            fetchPeriods();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (periodId, newStatus) => {
        try {
            await updatePayoutPeriod(periodId, { status: newStatus });
            setSuccess(`Period status updated to ${newStatus}.`);
            fetchPeriods();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeletePeriod = (period) => {
        setPeriodToDelete(period);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!periodToDelete) return;
        try {
            await deletePayoutPeriod(periodToDelete.id);
            setSuccess('Period deleted successfully!');
            setIsDeleteConfirmOpen(false);
            setPeriodToDelete(null);
            fetchPeriods();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Manage Payout Periods
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Paper component="form" onSubmit={handleCreatePeriod} elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Create New Period</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Period Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth required />}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth required />}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AddIcon />}
                            disabled={isSubmitting}
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Create'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ mb: 2 }}>Existing Periods</Typography>
            {isMobile ? (
                <Box>
                    {periods.length === 0 && !loading ? (
                        <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography sx={{ color: 'black' }}>{t('noPayoutPeriodsFound', { ns: 'pages/managerDashboard' })}</Typography>
                        </Paper>
                    ) : (
                        periods.map((period) => (
                            <Paper key={period.id} elevation={3} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" component="h3">{period.name}</Typography>
                                <Typography><strong>Start Date:</strong> {dayjs(period.start_date).format('YYYY-MM-DD')}</Typography>
                                <Typography><strong>End Date:</strong> {dayjs(period.end_date).format('YYYY-MM-DD')}</Typography>
                                <Typography><strong>Status:</strong> <span style={{ color: period.status === 'OPEN' ? 'green' : 'red', fontWeight: 'bold' }}>{period.status}</span></Typography>
                                <Box sx={{ mt: 1 }}>
                                    {period.status === 'OPEN' && (
                                        <Tooltip title="Close Period">
                                            <IconButton onClick={() => handleUpdateStatus(period.id, 'CLOSED')} color="warning">
                                                <LockIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {period.status === 'CLOSED' && (
                                            <Tooltip title="Re-open Period">
                                            <IconButton onClick={() => handleUpdateStatus(period.id, 'OPEN')} color="success">
                                                <CheckCircleIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Delete Period">
                                        <IconButton onClick={() => handleDeletePeriod(period.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                                </TableRow>
                            ) : periods.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No payout periods found.</TableCell>
                                </TableRow>
                            ) : (
                                periods.map((period) => (
                                    <TableRow key={period.id}>
                                        <TableCell>{period.name}</TableCell>
                                        <TableCell>{dayjs(period.start_date).format('YYYY-MM-DD')}</TableCell>
                                        <TableCell>{dayjs(period.end_date).format('YYYY-MM-DD')}</TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: period.status === 'OPEN' ? 'success.main' : 'text.secondary',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {period.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {period.status === 'OPEN' && (
                                                <Tooltip title="Close Period">
                                                    <IconButton onClick={() => handleUpdateStatus(period.id, 'CLOSED')} color="warning">
                                                        <LockIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {period.status === 'CLOSED' && (
                                                    <Tooltip title="Re-open Period">
                                                    <IconButton onClick={() => handleUpdateStatus(period.id, 'OPEN')} color="success">
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete Period">
                                                                                        <IconButton onClick={() => handleDeletePeriod(period)} color="error">
                                                                                            <DeleteIcon />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    )}
                                                
                                                    {/* Delete Confirmation Dialog */}
                                                    <Dialog
                                                        open={isDeleteConfirmOpen}
                                                        onClose={() => setIsDeleteConfirmOpen(false)}
                                                        aria-labelledby="alert-dialog-title"
                                                        aria-describedby="alert-dialog-description"
                                                    >
                                                        <DialogTitle id="alert-dialog-title">{t('confirmDeletion', { ns: 'common' })}</DialogTitle>
                                                        <DialogContent>
                                                            <DialogContentText id="alert-dialog-description">
                                                                {t('areYouSureToDeletePeriod', { ns: 'common', periodName: periodToDelete?.name })}
                                                            </DialogContentText>
                                                        </DialogContent>
                                                        <DialogActions>
                                                            <Button onClick={() => setIsDeleteConfirmOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
                                                            <Button onClick={handleConfirmDelete} color="error" autoFocus>{t('delete', { ns: 'common' })}</Button>
                                                        </DialogActions>
                                                    </Dialog>
                                                </Box>    );
};

export default PayoutPeriodsPage;