import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider, Collapse, IconButton, TextField
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { getCashOutsByCollector, getCompanyEmployees } from '../../api/tipApi';
import { getPayoutPeriods } from '../../api/payoutPeriodApi';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery, useTheme } from '@mui/material';

const CashOutRow = ({ cashOut, employees, isMobile }) => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard', 'pages/serverDashboard']);
  const [open, setOpen] = useState(false);

  const processedCashOut = useMemo(() => {
    if (!cashOut) return null;

    const adjustments = cashOut.adjustments || [];
    const tipOuts = adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0);
    const receivedTipsAdjustments = adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount > 0);

    const totalTipOuts = tipOuts.reduce((sum, adj) => sum + Math.abs(Number(adj.amount) || 0), 0);

    const aggregatedDetailsMap = new Map();

    // First pass: Aggregate tip-out amounts by ruleName and identify individual recipients from descriptions
    tipOuts.forEach(adj => {
      let ruleName = adj.description.replace('Tip-Out to ', '');
      let isIndividual = false;
      let parsedRecipientNames = [];

      const individualMatch = adj.description.replace('Tip-Out to ', '').match(/(.*) \((.*)\)/);
      if (individualMatch) {
        ruleName = individualMatch[1];
        parsedRecipientNames = individualMatch[2].split(', ');
        isIndividual = true;
      }

      if (!aggregatedDetailsMap.has(ruleName)) {
        aggregatedDetailsMap.set(ruleName, {
          ruleName,
          amount: 0,
          recipients: [],
          type: 'department',
        });
      }

      const currentDetail = aggregatedDetailsMap.get(ruleName);
      currentDetail.amount += Math.abs(Number(adj.amount) || 0);

      if (isIndividual && parsedRecipientNames.length > 0) {
        const amountPerParsedRecipient = Math.abs(Number(adj.amount) || 0) / parsedRecipientNames.length;
        parsedRecipientNames.forEach(name => {
          const existingRecipient = currentDetail.recipients.find(r => r.name === name);
          if (existingRecipient) {
            existingRecipient.amount += amountPerParsedRecipient;
          } else {
            currentDetail.recipients.push({ name, amount: amountPerParsedRecipient });
          }
        });
        currentDetail.type = 'individual';
      }
    });

    // Second pass: Add actual recipients from positive adjustments
    receivedTipsAdjustments.forEach(recAdj => {
      // Find the corresponding tipOut to get the ruleName
      const correspondingTipOut = tipOuts.find(adj => adj.rule_id === recAdj.rule_id);

      if (correspondingTipOut) {
        let ruleName = correspondingTipOut.description.replace('Tip-Out to ', '');
        const individualMatch = correspondingTipOut.description.replace('Tip-Out to ', '').match(/(.*) \((.*)\)/);
        if (individualMatch) {
          ruleName = individualMatch[1];
        }

        if (aggregatedDetailsMap.has(ruleName)) {
          const currentDetail = aggregatedDetailsMap.get(ruleName);
          const recipient = employees.find(emp => emp.id === recAdj.related_user_id);
          const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : recAdj.description.replace('Tip-Out received from ', '');
          const recipientAmount = Number(recAdj.amount) || 0;

          if (recipientAmount > 0) {
            const existingRecipient = currentDetail.recipients.find(r => r.name === recipientName);
            if (existingRecipient) {
              existingRecipient.amount += recipientAmount;
            } else {
              currentDetail.recipients.push({ name: recipientName, amount: recipientAmount });
            }
            currentDetail.type = 'individual'; // Mark as individual if actual recipients are found
          }
        }
      }
    });

    const details = Array.from(aggregatedDetailsMap.values()).filter(detail => detail.amount > 0 || detail.recipients.length > 0);

    return { ...cashOut, details, totalTipOuts };
  }, [cashOut, employees]);

  if (isMobile) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'black' }}>{dayjs.utc(processedCashOut.service_date).format('YYYY-MM-DD')}</Typography>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'black' }}>
              <strong>{t('totalSales', { ns: 'pages/serverDashboard' })}:</strong> {Number(processedCashOut.total_sales).toFixed(2)}&nbsp;$
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'black' }}>
              <strong>{t('cashOnHand', { ns: 'pages/serverDashboard' })}:</strong> {Number(processedCashOut.cash_on_hand).toFixed(2)}&nbsp;$
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'black' }}>
              <strong>{t('totalTipOuts', { ns: 'pages/serverDashboard' })}:</strong> {Number(processedCashOut.totalTipOuts).toFixed(2)}&nbsp;$
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'black' }}>
              <strong>{t('dueBack', { ns: 'pages/serverDashboard' })}:</strong> 
              <span style={{
                backgroundColor: processedCashOut.final_balance > 0 ? 'red' : processedCashOut.final_balance < 0 ? 'green' : 'inherit',
                padding: '2px 4px',
                borderRadius: '4px',
                color: 'white',
              }}>
                {Number(processedCashOut.final_balance).toFixed(2)}&nbsp;$
              </span>
            </Typography>
          </Grid>
        </Grid>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom component="div" sx={{ color: 'black' }}>
              {t('tipDistributionDetails', { ns: 'pages/serverDashboard' })}
            </Typography>
            {processedCashOut.details.map((detail, index) => (
              <Box key={index} sx={{ ml: 2, mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'black' }}><strong>{detail.ruleName}:</strong> ${detail.amount.toFixed(2)}</Typography>
                {detail.type === 'individual' && detail.recipients?.map((recipient, recIndex)=> (
                    <Typography key={recIndex} variant="body2" sx={{ ml: 2, color: 'black' }}>- {recipient.name}: ${recipient.amount.toFixed(2)}</Typography>
                  ))}
              </Box>
            ))}
          </Box>
        </Collapse>
      </Paper>
    )
  }

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>{dayjs.utc(processedCashOut.service_date).format('YYYY-MM-DD')}</Typography></TableCell>
        <TableCell><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>{Number(processedCashOut.total_sales).toFixed(2)}&nbsp;$</Typography></TableCell>
        <TableCell><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>{Number(processedCashOut.cash_on_hand).toFixed(2)}&nbsp;$</Typography></TableCell>
        <TableCell><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>{Number(processedCashOut.totalTipOuts).toFixed(2)}&nbsp;$</Typography></TableCell>
        <TableCell align="right">
          <span style={{
            backgroundColor: processedCashOut.final_balance > 0 ? 'red' : processedCashOut.final_balance < 0 ? 'green' : 'inherit',
            padding: '2px 4px',
            borderRadius: '4px',
            color: 'white',
          }}>
            <Typography variant={isMobile ? "body2" : "body1"} component="span">{Number(processedCashOut.final_balance).toFixed(2)}&nbsp;$</Typography>
          </span>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                {t('tipDistributionDetails', { ns: 'pages/serverDashboard' })}
              </Typography>
              {processedCashOut.details.map((detail, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'black' }}><strong>{detail.ruleName}:</strong> ${detail.amount.toFixed(2)}</Typography>
                  {detail.type === 'individual' && detail.recipients?.map((recipient, recIndex)=> (
                      <Typography key={recIndex} variant="body2" sx={{ ml: 2, color: 'black' }}>- {recipient.name}: ${recipient.amount.toFixed(2)}</Typography>
                    ))}
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const EmployeeCashOutHistoryPage = () => {
  const { t } = useTranslation(['common', 'pages/employeeDashboard', 'pages/serverDashboard']);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allCashOuts, setAllCashOuts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [payoutPeriods, setPayoutPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  useEffect(() => {
    const fetchCashOuts = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const [cashOuts, employeesData, periodsData] = await Promise.all([
            getCashOutsByCollector(user.id, '2020-01-01', dayjs().endOf('day').toISOString()),
            getCompanyEmployees(),
            getPayoutPeriods(),
          ]);
          setAllCashOuts(cashOuts);
          setEmployees(employeesData);
          setPayoutPeriods(periodsData);
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

  const { filteredCashOuts, summaryData } = useMemo(() => {
    let filteredData = allCashOuts;

    if (startDate && endDate) {
        filteredData = filteredData.filter(cashOut => {
            const serviceDate = dayjs.utc(cashOut.service_date);
            const start = dayjs.utc(startDate);
            const end = dayjs.utc(endDate);
            return !serviceDate.isBefore(start, 'day') && !serviceDate.isAfter(end, 'day');
        });
    }

    const summary = filteredData.reduce((acc, cashOut) => {
      acc.totalSales += Number(cashOut.total_sales) || 0;
      const tipOuts = (cashOut.adjustments || []).filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0);
      
      tipOuts.forEach(tipOut => {
        let ruleName = tipOut.description.replace('Tip-Out to ', '');
        const individualMatch = ruleName.match(/(.*) \((.*)\)/);
        if (individualMatch) {
          ruleName = individualMatch[1];
        }
        
        const amount = Math.abs(tipOut.amount);
        acc.totalTipOuts += amount;
        
        if (!acc.ruleTotals[ruleName]) {
          acc.ruleTotals[ruleName] = 0;
        }
        acc.ruleTotals[ruleName] += amount;
      });

      if (cashOut.final_balance > 0) {
        acc.paidToHouse += Number(cashOut.final_balance) || 0;
      } else {
        acc.owedToEmployee += Math.abs(cashOut.final_balance);
      }
      return acc;
    }, { totalSales: 0, paidToHouse: 0, owedToEmployee: 0, totalTipOuts: 0, ruleTotals: {} });

    return { filteredCashOuts: filteredData.sort((a, b) => new Date(b.service_date) - new Date(a.service_date)), summaryData: {
        totalSales: Number(summary.totalSales),
        paidToHouse: Number(summary.paidToHouse),
        owedToEmployee: Number(summary.owedToEmployee),
        totalTipOuts: Number(summary.totalTipOuts),
        ruleTotals: summary.ruleTotals
    } };
  }, [allCashOuts, startDate, endDate]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant={isMobile ? "h6" : "h4"} component="h1" sx={{ color: 'black', mb: 3 }}>
        {t('myCashOutHistory', { ns: 'pages/employeeDashboard' })}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('filter', { ns: 'common' })}</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => {
                    const periodId = e.target.value;
                    setSelectedPeriod(periodId);
                    if (periodId) {
                      const period = payoutPeriods.find(p => p.id === periodId);
                      setStartDate(dayjs.utc(period.start_date).format('YYYY-MM-DD'));
                      setEndDate(dayjs.utc(period.end_date).format('YYYY-MM-DD'));
                    } else {
                      setStartDate(dayjs().startOf('month').format('YYYY-MM-DD'));
                      setEndDate(dayjs().endOf('month').format('YYYY-MM-DD'));
                    }
                  }}
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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>{t('periodSummary', { ns: 'pages/employeeDashboard' })}</Typography>
        <Grid container spacing={2} sx={{ textAlign: 'center' }}>
          <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('totalSales', { ns: 'pages/serverDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${summaryData.totalSales.toFixed(2)}</Typography></Grid>
          <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('totalTipOuts', { ns: 'pages/serverDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${summaryData.totalTipOuts.toFixed(2)}</Typography></Grid>
          <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('owedToHouse', { ns: 'pages/employeeDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${summaryData.paidToHouse.toFixed(2)}</Typography></Grid>
          <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('owedToEmployee', { ns: 'pages/employeeDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${summaryData.owedToEmployee.toFixed(2)}</Typography></Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1 }}>{t('tipOutsByRule', { ns: 'pages/employeeDashboard' })}</Typography>
        {Object.entries(summaryData.ruleTotals).map(([ruleName, total]) => (
          <Typography key={ruleName} variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{ruleName}:</strong> ${total.toFixed(2)}</Typography>
        ))}
      </Paper>

      {filteredCashOuts.length === 0 ? (
        <Alert severity="info">{t('noCashOuts', { ns: 'pages/employeeDashboard' })}</Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 2 }}>
            <Typography component="span" variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'black' }}>
              <div style={{ width: 16, height: 16, backgroundColor: 'red', borderRadius: '4px', marginRight: 8, border: '1px solid black' }} />
              {t('owedToHouse', { ns: 'pages/employeeDashboard' })}
            </Typography>
            <Typography component="span" variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'black' }}>
              <div style={{ width: 16, height: 16, backgroundColor: 'green', borderRadius: '4px', marginRight: 8, border: '1px solid black' }} />
              {t('owedToYou', { ns: 'pages/employeeDashboard' })}
            </Typography>
          </Box>
          {isMobile ? (
            <Box>
              {filteredCashOuts.map((cashOut) => (
                <CashOutRow key={cashOut.id} cashOut={cashOut} employees={employees} isMobile={isMobile} />
              ))}
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('serviceDate', { ns: 'pages/employeeDashboard' })}</TableCell>
                    <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('totalSales', { ns: 'pages/serverDashboard' })}</TableCell>
                    <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('cashOnHand', { ns: 'pages/serverDashboard' })}</TableCell>
                    <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>{t('totalTipOuts', { ns: 'pages/serverDashboard' })}</TableCell>
                    <TableCell align="right" sx={{ color: 'black', fontWeight: 'bold' }}>{t('dueBack', { ns: 'pages/serverDashboard' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCashOuts.map((cashOut) => (
                    <CashOutRow key={cashOut.id} cashOut={cashOut} employees={employees} isMobile={isMobile} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default EmployeeCashOutHistoryPage;