import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider, TextField, useMediaQuery, useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allReceivedTips, setAllReceivedTips] = useState([]); // Store all fetched tips
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTipDetails, setSelectedTipDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    const fetchTips = async () => {
      try {
        setLoading(true);
        const tips = await getEmployeeReceivedTips(user.id);
        setAllReceivedTips(tips);
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchTips();
    }
  }, [user?.id, t]);

  const filteredTips = useMemo(() => {
    let currentFilteredTips = allReceivedTips;

    if (startDate && endDate) {
        currentFilteredTips = currentFilteredTips.filter(tip => {
            const tipDate = dayjs(tip.start_date);
            return !tipDate.isBefore(dayjs(startDate), 'day') && !tipDate.isAfter(dayjs(endDate), 'day');
        });
    }

    return currentFilteredTips.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
}, [allReceivedTips, startDate, endDate]);

  const handleTipClick = async (tip) => {
    if (tip.source === 'pool') {
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
    } else {
        setSelectedTipDetails(tip);
        setIsDetailsModalOpen(true);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant={isMobile ? "h6" : "h4"} component="h1" sx={{ color: 'black', mb: isMobile ? 2 : 3 }}>
        {t('myReceivedTips', { ns: 'pages/employeeDashboard' })}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1}>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    id="start-date"
                    label={t('startDate', { ns: 'common' })}
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    id="end-date"
                    label={t('endDate', { ns: 'common' })}
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Grid>
        </Grid>
      </Box>

      {filteredTips.length === 0 ? (
        <Alert severity="info">{t('noReceivedTips', { ns: 'pages/employeeDashboard' })}</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ p: 1 }}>
          <Table>
            <TableHead sx={{ display: isMobile ? 'none' : 'table-header-group' }}>
              <TableRow>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('period', { ns: 'common' })}</TableCell>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('positionOrRole', { ns: 'common' })}</TableCell>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('amount', { ns: 'common' })}</TableCell>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('sentBy', { ns: 'common' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTips.map((tip, index) => (
                isMobile ? (
                  <Paper 
                    key={index} 
                    sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                    onClick={() => handleTipClick(tip)}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'black' }}>{t('period', { ns: 'common' })}:</Typography>
                    <Typography variant="body2" sx={{ color: 'black', fontWeight: 'bold' }}>{dayjs(tip.start_date).format('YYYY-MM-DD')} - {dayjs(tip.end_date).format('YYYY-MM-DD')}</Typography>

                    <Typography variant="subtitle2" sx={{ color: 'black', mt: 1 }}>{t('positionOrRole', { ns: 'common' })}:</Typography>
                    <Typography variant="body2" sx={{ color: 'black' }}>
                      {tip.department_name.startsWith('Tip-Out received from ') 
                        ? tip.department_name.replace('Tip-Out received from ', '') 
                        : tip.department_name}
                    </Typography>

                    <Typography variant="subtitle2" sx={{ color: 'black', mt: 1 }}>{t('amount', { ns: 'common' })}:</Typography>
                    <Typography variant="body2" sx={{ color: 'black', fontWeight: 'bold' }}>{Number(tip.distributed_amount).toFixed(2)} $</Typography>

                    {tip.source === 'individual' && tip.sender_first_name && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'black', mt: 1 }}>{t('sentBy', { ns: 'common' })}:</Typography>
                        <Typography variant="body2" sx={{ color: 'black' }}>{`${tip.sender_first_name} ${tip.sender_last_name}`}</Typography>
                      </>
                    )}
                  </Paper>
                ) : (
                  <TableRow 
                    key={index} 
                    onClick={() => handleTipClick(tip)} 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                  >
                    <TableCell align="center" sx={{ color: 'black' }}>{dayjs(tip.start_date).format('YYYY-MM-DD')} - {dayjs(tip.end_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell align="center" sx={{ color: 'black' }}>
                      {tip.department_name.startsWith('Tip-Out received from ') 
                        ? tip.department_name.replace('Tip-Out received from ', '') 
                        : tip.department_name}
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'black' }}>{Number(tip.distributed_amount).toFixed(2)} $</TableCell>
                    <TableCell align="center" sx={{ color: 'black' }}>
                      {tip.source === 'individual' ? `${tip.sender_first_name} ${tip.sender_last_name}` : ''}
                    </TableCell>
                  </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tip Details Modal */}
      <Dialog open={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tipDetailsTitle', { ns: 'pages/employeeDashboard' })}</DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <CircularProgress />
          ) : detailsError ? (
            <Alert severity="error">{detailsError}</Alert>
          ) : selectedTipDetails ? (
            <Box>
              {selectedTipDetails.source === 'pool' ? (
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'black' }}>
                    {t('tipDetailsTitle', { ns: 'pages/employeeDashboard' })}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="black">{t('positionOrRole', { ns: 'common' })}:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>
                        {selectedTipDetails.department_name.startsWith('Tip-Out received from ') 
                          ? selectedTipDetails.department_name.replace('Tip-Out received from ', '') 
                          : selectedTipDetails.department_name}
                      </Typography>
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
              ) : (
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '8px', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'black' }}>
                    {t('tipDetailsTitle', { ns: 'pages/employeeDashboard' })}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="black">{t('positionOrRole', { ns: 'common' })}:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>
                        {selectedTipDetails.department_name.startsWith('Tip-Out received from ') 
                          ? selectedTipDetails.department_name.replace('Tip-Out received from ', '') 
                          : selectedTipDetails.department_name}
                      </Typography>
                    </Grid>
                    {selectedTipDetails.source === 'individual' && selectedTipDetails.sender_first_name && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="black">{t('sentBy', { ns: 'common' })}:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{selectedTipDetails.sender_first_name} {selectedTipDetails.sender_last_name}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="black">{t('date', { ns: 'common' })}:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{dayjs(selectedTipDetails.start_date).format('YYYY-MM-DD')}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="black">{t('amount', { ns: 'common' })}:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon sx={{ mr: 0.5, color: 'success.main' }} />
                        <Typography variant="h6" color="success.main">{Number(selectedTipDetails.distributed_amount).toFixed(2)} $</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
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