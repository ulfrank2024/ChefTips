import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, TableContainer, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, useMediaQuery,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useAuth } from '../../context/AuthContext';
import { getPayoutPeriods } from '../../api/payoutPeriodApi';
import axios from 'axios';

dayjs.extend(utc);
dayjs.extend(localizedFormat);

const ReportCard = ({ report, calculateDistributedTips, t }) => (
  <Card elevation={0} sx={{ mb: 2, backgroundColor: 'transparent', border: '1px solid #e0e0e0' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>{report.employee_name}</Typography>
      <Typography variant="body2" sx={{ color: 'black' }}>{t('distributedTips', { ns: 'pages/managerDashboard' })}: {Number(calculateDistributedTips(report.adjustments)).toFixed(2)}</Typography>
      <Typography variant="body2" sx={{ color: 'black' }}>{t('grossTips', { ns: 'common' })}: {Number(report.amount ?? 0).toFixed(2)}</Typography>
      <Typography variant="body2" sx={{ color: 'black' }}>{t('netTips', { ns: 'common' })}: {Number(report.net_tips ?? 0).toFixed(2)}</Typography>
      <Typography variant="body2" sx={{ color: 'black' }}>{t('finalBalance', { ns: 'common' })}: {Number(report.final_balance ?? 0).toFixed(2)}</Typography>
      <Typography variant="body2" sx={{ color: 'black' }}>{t('status', { ns: 'common' })}: {report.status}</Typography>

      {report.adjustments && report.adjustments.length > 0 && (
        <Accordion sx={{ mt: 2, backgroundColor: 'transparent' }} elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
            <Typography sx={{ color: 'black' }}>{t('details', { ns: 'common' })}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: 'black' }}>
              {t('receivedTips', { ns: 'pages/managerDashboard' })}:
            </Typography>
            {report.adjustments
              .filter(adj => adj.amount > 0 && (adj.distribution_type === 'INDIVIDUAL_SELECTION' || (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.related_user_id)))
              .map((adj, adjIndex) => (
                <Box key={adjIndex} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'black' }}>
                  <span>{adj.employee_name || adj.description} {adj.employee_role && `(${adj.employee_role})`}</span>
                  <span>{Number(adj.amount).toFixed(2)}</span>
                </Box>
              ))}
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: 'black' }}>
              {t('departmentContributions', { ns: 'pages/managerDashboard' })}:
            </Typography>
            {report.adjustments
              .filter(adj => 
                (adj.distribution_type === 'DEPARTMENT_POOL' && adj.description === 'cuisinier') ||
                (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0 && adj.description.startsWith('Tip-Out to cuisinier'))
              )
              .map((adj, adjIndex) => (
                <Box key={adjIndex} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'black' }}>
                  <span>{adj.description.replace('Tip-Out to ', '')}</span>
                  <span>{Number(Math.abs(adj.amount)).toFixed(2)}</span>
                </Box>
              ))}
          </AccordionDetails>
        </Accordion>
      )}
    </CardContent>
  </Card>
);

const ServerOverview = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard', 'errors']);
  const { user, token, isLoading } = useAuth();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cashOutData, setCashOutData] = useState([]);
  const [payoutPeriods, setPayoutPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const calculateDistributedTips = (adjustments) => {
    let totalDistributed = 0;
    if (adjustments) {
      adjustments.forEach(adj => {
        if (adj.amount > 0 && (adj.distribution_type === 'INDIVIDUAL_SELECTION' || (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.related_user_id))) {
          totalDistributed += Number(adj.amount);
        }
        if ((adj.distribution_type === 'DEPARTMENT_POOL' && adj.description === 'cuisinier') || (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0 && adj.description.startsWith('Tip-Out to cuisinier'))) {
          totalDistributed += Number(Math.abs(adj.amount));
        }
      });
    }
    return totalDistributed;
  };

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const periods = await getPayoutPeriods();
        const now = new Date();
        const filteredPeriods = periods.filter(p => dayjs.utc(p.start_date).toDate() <= now);
        setPayoutPeriods(filteredPeriods);
      } catch (err) {
        setError(t('FETCH_PAYOUT_PERIODS_ERROR', { ns: 'errors' }));
      }
    };
    if (user?.company_id) fetchPeriods();
  }, [user?.company_id, t]);

  const fetchServerOverview = async () => {
    if (isLoading || !user || !user.company_id || !token) {
      setError(t('COMPANY_ID_NOT_FOUND', { ns: 'errors' }));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        companyId: user.company_id,
        ...(selectedPeriod !== 'all' && { 
          startDate: startDate?.toISOString(), 
          endDate: endDate?.toISOString() 
        })
      };
      console.log("Fetching cash out reports with params:", params);
      const { data } = await axios.get(`${import.meta.env.VITE_TIP_SERVICE_URL}/api/tips/cash-out-reports`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setCashOutData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error ? t(err.response.data.error, { ns: 'errors' }) : t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered. StartDate:", startDate, "EndDate:", endDate);
    if (!isLoading && user && user.company_id && token) {
      fetchServerOverview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startDate, endDate, isLoading, token]);

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('cashOutReports', { ns: 'pages/managerDashboard' })}
      </Typography>

      {isLoading ? <CircularProgress /> : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl fullWidth>
              <InputLabel>{t('payoutPeriod', { ns: 'common' })}</InputLabel>
              <Select
                value={selectedPeriod}
                label={t('payoutPeriod', { ns: 'common' })}
                onChange={(e) => {
                  const periodId = e.target.value;
                  setSelectedPeriod(periodId);
                  if (periodId === 'all') {
                    setStartDate(null);
                    setEndDate(null);
                  } else {
                    const period = payoutPeriods.find(p => p.id === periodId);
                    if (period) {
                      console.log("Selected Period:", period);
                      setStartDate(dayjs.utc(period.start_date).toDate());
                      setEndDate(dayjs.utc(period.end_date).toDate());
                    }
                  }
                }}
              >
                <MenuItem value="all">{t('allPeriods', { ns: 'common' })}</MenuItem>
                {payoutPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {`${period.name} (${dayjs.utc(period.start_date).format('ll')} - ${dayjs.utc(period.end_date).format('ll')})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

          </Box>

          {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
            !cashOutData.length ? (
              <Typography variant="body1" sx={{ color: 'black' }}>{t('noDataFound', { ns: 'pages/managerDashboard' })}</Typography>
            ) : (
              <Box sx={{ mt: 4 }}>
                {Object.entries(cashOutData.reduce((acc, report) => {
                  const periodId = report.payout_period_id || 'no_period';
                  if (!acc[periodId]) acc[periodId] = [];
                  acc[periodId].push(report);
                  return acc;
                }, {})).map(([periodId, reportsInPeriod]) => {
                  const period = payoutPeriods.find(p => p.id === periodId);
                  const periodName = period ? `${period.name} (${dayjs.utc(period.start_date).format('ll')} - ${dayjs.utc(period.end_date).format('ll')})` : t('noPayoutPeriod', {ns: 'pages/managerDashboard'});

                  const groupedByDate = reportsInPeriod.reduce((acc, report) => {
                    const date = dayjs.utc(report.date).format('ll');
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(report);
                    return acc;
                  }, {});

                  return (
                    <Accordion key={periodId} defaultExpanded elevation={0} sx={{ mb: 2, backgroundColor: 'transparent', border: '1px solid #e0e0e0' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
                        <Typography variant="h6" sx={{ color: 'black' }}>{periodName}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {Object.entries(groupedByDate).map(([date, reportsOnDate]) => (
                          <Accordion key={date} defaultExpanded elevation={0} sx={{ mb: 1, ml: isMobile ? 0 : 2, backgroundColor: 'transparent', border: '1px solid #e0e0e0' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
                              <Typography variant="subtitle1" sx={{ color: 'black' }}>{t('date', { ns: 'common' })}: {date}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {isMobile ? (
                                reportsOnDate.map(report => <ReportCard key={report.id} report={report} calculateDistributedTips={calculateDistributedTips} t={t} />)
                              ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                                  <Table size="small" sx={{ minWidth: 650 }}>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ color: 'black' }}>{t('employee', { ns: 'common' })}</TableCell>
                                        <TableCell align="right" sx={{ color: 'black' }}>{t('distributedTips', { ns: 'pages/managerDashboard' })}</TableCell>
                                        <TableCell align="right" sx={{ color: 'black' }}>{t('grossTips', { ns: 'common' })}</TableCell>
                                        <TableCell align="right" sx={{ color: 'black' }}>{t('netTips', { ns: 'common' })}</TableCell>
                                        <TableCell align="right" sx={{ color: 'black' }}>{t('finalBalance', { ns: 'common' })}</TableCell>
                                        <TableCell sx={{ color: 'black' }}>{t('status', { ns: 'common' })}</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {reportsOnDate.map((report) => (
                                        <React.Fragment key={report.id}>
                                          <TableRow>
                                            <TableCell sx={{ color: 'black' }}>{report.employee_name}</TableCell>
                                            <TableCell align="right" sx={{ color: 'black' }}>{Number(calculateDistributedTips(report.adjustments)).toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'black' }}>{Number(report.amount ?? 0).toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'black' }}>{Number(report.net_tips ?? 0).toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'black' }}>{Number(report.final_balance ?? 0).toFixed(2)}</TableCell>
                                            <TableCell sx={{ color: 'black' }}>{report.status}</TableCell>
                                          </TableRow>
                                          {report.adjustments && report.adjustments.length > 0 && (
                                            <TableRow>
                                              <TableCell colSpan={6} sx={{ pb: 2 }}>
                                                <Accordion elevation={0} sx={{ backgroundColor: 'transparent' }}>
                                                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
                                                    <Typography sx={{ color: 'black' }}>{t('details', { ns: 'common' })}</Typography>
                                                  </AccordionSummary>
                                                  <AccordionDetails>
                                                    <Box sx={{ mt: 2 }}>
                                                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: 'black' }}>
                                                        {t('receivedTips', { ns: 'pages/managerDashboard' })}:
                                                      </Typography>
                                                      <TableContainer sx={{ width: 'auto', ml: 2, minWidth: 300, overflowX: 'auto' }}>
                                                        <Table size="small">
                                                          <TableHead>
                                                            <TableRow>
                                                              <TableCell sx={{ color: 'black' }}>{t('recipient', { ns: 'common' })}</TableCell>
                                                              <TableCell align="right" sx={{ color: 'black' }}>{t('amount', { ns: 'common' })}</TableCell>
                                                            </TableRow>
                                                          </TableHead>
                                                          <TableBody>
                                                            {report.adjustments
                                                              .filter(adj => adj.amount > 0 && (adj.distribution_type === 'INDIVIDUAL_SELECTION' || (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.related_user_id)))
                                                              .map((adj, adjIndex) => (
                                                                <TableRow key={adjIndex}>
                                                                  <TableCell sx={{ color: 'black' }}>{adj.employee_name || adj.description} {adj.employee_role && `(${adj.employee_role})`}</TableCell>
                                                                  <TableCell align="right" sx={{ color: 'black' }}>{Number(adj.amount).toFixed(2)}</TableCell>
                                                                </TableRow>
                                                              ))}
                                                          </TableBody>
                                                        </Table>
                                                      </TableContainer>

                                                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, color: 'black' }}>
                                                        {t('departmentContributions', { ns: 'pages/managerDashboard' })}:
                                                      </Typography>
                                                      <TableContainer sx={{ width: 'auto', ml: 2, minWidth: 300, overflowX: 'auto' }}>
                                                        <Table size="small">
                                                          <TableHead>
                                                            <TableRow>
                                                              <TableCell sx={{ color: 'black' }}>{t('department', { ns: 'common' })}</TableCell>
                                                              <TableCell align="right" sx={{ color: 'black' }}>{t('amount', { ns: 'common' })}</TableCell>
                                                            </TableRow>
                                                          </TableHead>
                                                          <TableBody>
                                                            {report.adjustments
                                                              .filter(adj => 
                                                                (adj.distribution_type === 'DEPARTMENT_POOL' && adj.description === 'cuisinier') ||
                                                                (adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0 && adj.description.startsWith('Tip-Out to cuisinier'))
                                                              )
                                                              .map((adj, adjIndex) => (
                                                                <TableRow key={adjIndex}>
                                                                  <TableCell sx={{ color: 'black' }}>{adj.description.replace('Tip-Out to ', '')}</TableCell>
                                                                  <TableCell align="right" sx={{ color: 'black' }}>{Number(Math.abs(adj.amount)).toFixed(2)}</TableCell>
                                                                </TableRow>
                                                              ))}
                                                          </TableBody>
                                                        </Table>
                                                      </TableContainer>
                                                    </Box>
                                                  </AccordionDetails>
                                                </Accordion>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )
          )}
        </>
      )}
    </Box>
  );
};

export default ServerOverview;