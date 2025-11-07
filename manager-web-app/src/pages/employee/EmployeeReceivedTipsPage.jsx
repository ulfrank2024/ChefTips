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
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { getEmployeeReceivedTips, getPoolSummary } from '../../api/tipApi';
import { getPayoutPeriods } from '../../api/payoutPeriodApi';
import { useAuth } from '../../context/AuthContext';

const EmployeeReceivedTipsPage = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard']);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allReceivedTips, setAllReceivedTips] = useState([]); // Store all fetched tips
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTipDetails, setSelectedTipDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [payoutPeriods, setPayoutPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          const [tips, periods] = await Promise.all([
            getEmployeeReceivedTips(user.id),
            getPayoutPeriods(),
          ]);
          setAllReceivedTips(tips);
          setPayoutPeriods(periods);
        }
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchInitialData();
    }
  }, [user?.id, t]);

  const filteredTips = useMemo(() => {
    if (!selectedPeriod) {
      return allReceivedTips;
    }
    const period = payoutPeriods.find(p => p.id === selectedPeriod);
    if (!period) {
      return allReceivedTips;
    }
    return allReceivedTips.filter(tip => {
      const tipDate = dayjs(tip.start_date);
      return tipDate.isSameOrAfter(dayjs(period.start_date), 'day') && tipDate.isSameOrBefore(dayjs(period.end_date), 'day');
    });
  }, [selectedPeriod, allReceivedTips, payoutPeriods]);

  const groupedTips = useMemo(() => {
    const groups = {};
    filteredTips.forEach(tip => {
      const associatedPeriod = payoutPeriods.find(p => 
        dayjs(tip.start_date).isSameOrAfter(dayjs(p.start_date), 'day') &&
        dayjs(tip.end_date).isSameOrBefore(dayjs(p.end_date), 'day')
      );
      const periodKey = associatedPeriod ? associatedPeriod.id : 'unassigned';
      const periodDisplay = associatedPeriod ? {
        name: associatedPeriod.name,
        startDate: dayjs.utc(associatedPeriod.start_date).format('DD MMMM YYYY'),
        endDate: dayjs.utc(associatedPeriod.end_date).format('DD MMMM YYYY')
      } : {
        name: t('unassignedPeriod', { ns: 'common' }),
        startDate: '',
        endDate: ''
      };

      if (!groups[periodKey]) {
        groups[periodKey] = {
          periodInfo: periodDisplay,
          periodTotal: 0,
          dates: {}
        };
      }

      const date = dayjs.utc(tip.created_at).format('YYYY-MM-DD');
      if (!groups[periodKey].dates[date]) {
        groups[periodKey].dates[date] = {
          tips: [],
          dateTotal: 0
        };
      }
      const amount = Number(tip.distributed_amount) || 0;
      groups[periodKey].dates[date].tips.push(tip);
      groups[periodKey].dates[date].dateTotal += amount;
      groups[periodKey].periodTotal += amount;
    });
    return groups;
  }, [filteredTips, payoutPeriods, t]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant={isMobile ? "h6" : "h4"} component="h1" sx={{ color: 'black', mb: 3 }}>
        {t('receivedTipsHistory', { ns: 'pages/managerDashboard' })}
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('filter', { ns: 'common' })}</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  displayEmpty
                  inputProps={{ 'aria-label': t('payoutPeriod', { ns: 'common' }) }}
                  MenuProps={{
                    PaperProps: {
                      sx: { zIndex: (theme) => theme.zIndex.drawer + 2 }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return t('all', { ns: 'common' });
                    }
                    const selectedPeriod = payoutPeriods.find(p => p.id === selected);
                    return selectedPeriod ? `${selectedPeriod.name} (${dayjs.utc(selectedPeriod.start_date).format('YYYY-MM-DD')} - ${dayjs.utc(selectedPeriod.end_date).format('YYYY-MM-DD')})` : '';
                  }}
                >
                  <MenuItem value="">
                    {t('all', { ns: 'common' })}
                  </MenuItem>
                  {payoutPeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id} sx={{ fontSize: '0.875rem' }}>
                      {period.name} ({dayjs.utc(period.start_date).format('YYYY-MM-DD')} - {dayjs.utc(period.end_date).format('YYYY-MM-DD')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
        </Grid>
      </Paper>
      {filteredTips.length === 0 ? (
        <Alert severity="info">{t('noReceivedTips', { ns: 'pages/employeeDashboard' })}</Alert>
      ) : (
        Object.entries(groupedTips).map(([periodKey, periodGroup]) => (
          <Box key={periodKey} sx={{ mb: 4, backgroundColor: theme.palette.grey[100], p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant={isMobile ? "h6" : "h5"} component="h2" sx={{ color: 'black' }}>
                      {periodGroup.periodInfo.name}
                  </Typography>
              </Box>
              <Typography variant={isMobile ? "subtitle1" : "h5"} component="h2" sx={{ color: 'black' }}>
                  Total: ${periodGroup.periodTotal.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, color: 'text.secondary' }}>
              {periodGroup.periodInfo.startDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                      <EventAvailableIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>
                          Début: {periodGroup.periodInfo.startDate}
                      </Typography>
                  </Box>
              )}
              {periodGroup.periodInfo.endDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventBusyIcon sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>
                          Fin: {periodGroup.periodInfo.endDate}
                      </Typography>
                  </Box>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {Object.entries(periodGroup.dates).map(([date, dateGroup]) => (
              <Box key={date} sx={{ mb: 3, pl: isMobile ? 0 : 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant={isMobile ? "subtitle1" : "h6"} component="h3" sx={{ color: 'black' }}>
                    {dayjs(date).format('DD MMMM YYYY')}
                  </Typography>
                  <Typography variant={isMobile ? "subtitle2" : "h6"} component="h3" sx={{ color: 'black' }}>
                    Total: ${dateGroup.dateTotal.toFixed(2)}
                  </Typography>
                </Box>
                {isMobile ? (
                  <Box>
                    {dateGroup.tips.map((tip, index) => (
                      <Paper 
                        key={index} 
                        sx={{ p: 2, mb: 2, cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                        onClick={() => handleTipClick(tip)}
                      >
                        <Typography variant="subtitle2" sx={{ color: 'black' }}>{t('positionOrRole', { ns: 'common' })}:</Typography>
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
                    ))}
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={2} sx={{ p: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('positionOrRole', { ns: 'common' })}</TableCell>
                          <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('amount', { ns: 'common' })}</TableCell>
                          <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>{t('sentBy', { ns: 'common' })}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dateGroup.tips.map((tip, index) => (
                          <TableRow 
                            key={index} 
                            onClick={() => handleTipClick(tip)} 
                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                          >
                            <TableCell sx={{ color: 'black' }}>
                              {tip.department_name.startsWith('Tip-Out received from ') 
                                ? tip.department_name.replace('Tip-Out received from ', '') 
                                : tip.department_name}
                            </TableCell>
                            <TableCell align="center" sx={{ color: 'black' }}>{Number(tip.distributed_amount).toFixed(2)} $</TableCell>
                            <TableCell align="center" sx={{ color: 'black' }}>
                              {tip.source === 'individual' ? `${tip.sender_first_name} ${tip.sender_last_name}` : t('fromTipPool', { ns: 'common' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ))}
          </Box>
        ))
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
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{dayjs.utc(selectedTipDetails.start_date).format('YYYY-MM-DD')} - {dayjs.utc(selectedTipDetails.end_date).format('YYYY-MM-DD')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="black">{t('creationDate', { ns: 'common' })}:</Typography>
                      <Typography variant="body1" sx={{ color: 'black' }}>{dayjs.utc(selectedTipDetails.pool_created_at).format('YYYY-MM-DD HH:mm')}</Typography>
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
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>{dayjs.utc(selectedTipDetails.start_date).format('YYYY-MM-DD')}</Typography>
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