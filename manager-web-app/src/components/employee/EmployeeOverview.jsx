import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { useAuth } from "../../context/AuthContext.jsx";
import { useMediaQuery, useTheme } from '@mui/material';
import {
  getCashOutsByCollector,
  getEmployeeReceivedTips,
  getPoolDetails,
  getCompanyEmployees,
} from "../../api/tipApi";
import { getPayoutPeriods } from "../../api/payoutPeriodApi";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SpeedIcon from "@mui/icons-material/Speed";
import DeclareTipModal from "../server/DeclareTipModal";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const EmployeeOverview = ({ isManagerView = false }) => {
  const { t } = useTranslation(["common", "pages/employeeDashboard", "pages/serverDashboard"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [allCashOuts, setAllCashOuts] = useState([]);
  const [receivedTips, setReceivedTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeclareTipModalOpen, setIsDeclareTipModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [payoutPeriods, setPayoutPeriods] = useState([]);

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const fetchEmployeeDashboardData = async () => {
    setLoading(true);
    try {
      if (user && user.id) {
        const [employeesData, periodsData] = await Promise.all([
          getCompanyEmployees(),
          getPayoutPeriods(),
        ]);
        setEmployees(employeesData);
        setPayoutPeriods(periodsData);

        if (user.can_cash_out) {
          const cashOuts = await getCashOutsByCollector(user.id, dayjs().subtract(2, 'year').format('YYYY-MM-DD'), dayjs().add(1, 'year').format('YYYY-MM-DD'));
          setAllCashOuts(cashOuts);
          if (cashOuts.length > 0) {
            const sortedCashOuts = cashOuts.sort((a, b) => {
                const dateComparison = dayjs(b.service_date).unix() - dayjs(a.service_date).unix();
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                return dayjs(b.created_at).unix() - dayjs(a.created_at).unix();
            });
          }
        } else {
          const tips = await getEmployeeReceivedTips(user.id);
          setReceivedTips(tips);
        }
      } else {
        setError(t("userIdNotFound", { ns: "pages/employeeDashboard" }));
      }
    } catch (err) {
      setError(t(err.message, { ns: "errors" }) || t("somethingWentWrong", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDashboardData();
  }, [user, t, location.state]);

  const summaryData = useMemo(() => {
    let totalSales = 0;
    let totalTipOuts = 0;
    let paidToHouse = 0;
    let owedToEmployee = 0;
    let totalReceived = 0;

    // Calculate for cash-out users
    let filteredCashOutsData = allCashOuts;
    if (startDate && endDate) {
        filteredCashOutsData = filteredCashOutsData.filter(cashOut => {
            const serviceDate = dayjs(cashOut.service_date);
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            return !serviceDate.isBefore(start, 'day') && !serviceDate.isAfter(end, 'day');
        });
    }

    const cashOutSummary = filteredCashOutsData.reduce((acc, cashOut) => {
      acc.totalSales += Number(cashOut.total_sales) || 0;
      const tipOuts = (cashOut.adjustments || []).filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0);
      const currentTotalTipOuts = tipOuts.reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
      acc.totalTipOuts += currentTotalTipOuts;

      const finalBalance = Number(cashOut.final_balance) || 0;

      if (finalBalance > 0) {
        acc.paidToHouse += finalBalance;
      } else {
        acc.owedToEmployee += Math.abs(finalBalance);
      }
      return acc;
    }, { totalSales: 0, paidToHouse: 0, owedToEmployee: 0, totalTipOuts: 0 });

    totalSales = cashOutSummary.totalSales;
    totalTipOuts = cashOutSummary.totalTipOuts;
    paidToHouse = cashOutSummary.paidToHouse;
    owedToEmployee = cashOutSummary.owedToEmployee;

    // Calculate for non-cash-out users
    let filteredTipsData = receivedTips;
    if (startDate && endDate) {
        filteredTipsData = filteredTipsData.filter(tip => {
            const tipDate = dayjs(tip.start_date);
            return !tipDate.isBefore(dayjs(startDate), 'day') && !tipDate.isAfter(dayjs(endDate), 'day');
        });
    }
    totalReceived = filteredTipsData.reduce((acc, tip) => acc + Number(tip.distributed_amount), 0);

        return {
          totalSales: Number(totalSales),
          totalTipOuts: Number(totalTipOuts),
          paidToHouse: Number(paidToHouse),
          owedToEmployee: Number(owedToEmployee),
          totalReceived: Number(totalReceived)
        };
      }, [allCashOuts, receivedTips, startDate, endDate, user]);
  const latestCashOut = (() => {
    if (allCashOuts.length === 0) return null;
    const sorted = [...allCashOuts].sort((a, b) => {
        const dateComparison = dayjs(b.service_date).unix() - dayjs(a.service_date).unix();
        if (dateComparison !== 0) return dateComparison;
        return dayjs(b.created_at).unix() - dayjs(a.created_at).unix();
    });
    return sorted[0];
  })();

  const getProcessedCashOut = () => {
    if (!latestCashOut) return null;

    const adjustments = latestCashOut.adjustments || [];
    const ruleDetailsMap = new Map();

    let totalTipOuts = 0;

    // First pass: Process negative adjustments (tip-outs from collector) to establish rule base amounts
    adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0)
               .forEach(adj => {
      const ruleId = adj.rule_id;
      if (ruleId) { // Ensure rule_id exists
        let ruleName = adj.description.replace('Tip-Out to ', '');
        const individualMatch = ruleName.match(/(.*) \((.*)\)/);
        if (individualMatch) {
          ruleName = individualMatch[1];
        }

        if (!ruleDetailsMap.has(ruleId)) {
          ruleDetailsMap.set(ruleId, {
            ruleName: ruleName,
            amount: 0, // This will be the total amount for the rule (from collector's perspective)
            recipients: [],
            type: 'department', // Default type
          });
        }
        const currentRule = ruleDetailsMap.get(ruleId);
        currentRule.amount += Math.abs(Number(adj.amount) || 0);
        totalTipOuts += Math.abs(Number(adj.amount) || 0);
      }
    });

    // Second pass: Process positive adjustments (tips received by individuals) to add recipients
    adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount > 0 && adj.related_user_id)
               .forEach(adj => {
      const ruleId = adj.rule_id;
      if (ruleId && ruleDetailsMap.has(ruleId)) {
        const currentRule = ruleDetailsMap.get(ruleId);
        const recipient = employees.find(emp => emp.id === adj.related_user_id);
        const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : adj.description.replace('Tip-Out received from ', '');
        const recipientAmount = Number(adj.amount) || 0;

        const existingRecipient = currentRule.recipients.find(r => r.name === recipientName);
        if (existingRecipient) {
          existingRecipient.amount += recipientAmount;
        } else {
          currentRule.recipients.push({ name: recipientName, amount: recipientAmount });
        }
        currentRule.type = 'individual';
      }
    });

    // Handle department pools that might not have individual recipients but have a negative adjustment
    adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0 && !adj.related_user_id)
               .forEach(adj => {
      const ruleId = adj.rule_id;
      if (ruleId && !ruleDetailsMap.has(ruleId)) {
        let ruleName = adj.description.replace('Tip-Out to ', '');
        ruleDetailsMap.set(ruleId, {
          ruleName: ruleName,
          amount: Math.abs(Number(adj.amount) || 0),
          recipients: [],
          type: 'department',
        });
        totalTipOuts += Math.abs(Number(adj.amount) || 0);
      }
    });

    const details = Array.from(ruleDetailsMap.values()).filter(detail => detail.amount > 0 || detail.recipients.length > 0);

    return {
      ...latestCashOut,
      total_sales: Number(latestCashOut.total_sales) || 0,
      cash_on_hand: Number(latestCashOut.cash_on_hand) || 0,
      totalTipOuts,
      details,
      dueBack: Number(latestCashOut.final_balance) || 0,
    };
  };
  const processedCashOut = getProcessedCashOut();

  const groupedByDateAndRole = useMemo(() => {
    const dateGroups = {};
    receivedTips.forEach(tip => {
        const date = dayjs(tip.start_date).format('YYYY-MM-DD');
        if (!dateGroups[date]) {
            dateGroups[date] = {
                roles: {},
                dayTotal: 0,
            };
        }

        const role = tip.department_name;
        if (!dateGroups[date].roles[role]) {
            dateGroups[date].roles[role] = {
                tips: [],
                total: 0,
            };
        }

        dateGroups[date].roles[role].tips.push(tip);
        dateGroups[date].roles[role].total += Number(tip.distributed_amount);
        dateGroups[date].dayTotal += Number(tip.distributed_amount);
    });

    return Object.entries(dateGroups).sort(([dateA], [dateB]) => dayjs(dateB).unix() - dayjs(dateA).unix());
  }, [receivedTips]);


  const openPeriod = payoutPeriods.find(p => p.status === 'OPEN');

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {!isManagerView && (
        <>
          <Typography variant={isMobile ? "h6" : "h5"} component="h2" sx={{ mb: 3 }}>
            {t("overview", { ns: "pages/employeeDashboard" })}
          </Typography>
    
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                {t("welcome", { ns: "common" })},{" "}
                {user?.first_name || "Employee"}!
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <BusinessIcon sx={{ mr: 1 }} />
              <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
                {user?.company_name}
              </Typography>
            </Box>
          </Paper>
        </>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('periodSummary', { ns: 'pages/employeeDashboard' })}</Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
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
        {user && user.can_cash_out ? (
            <Grid key="cash-out-summary" container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('totalSales', { ns: 'pages/serverDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${(summaryData.totalSales || 0).toFixed(2)}</Typography></Grid>
                <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('totalTipOuts', { ns: 'pages/serverDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${(summaryData.totalTipOuts || 0).toFixed(2)}</Typography></Grid>
                <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('paidToHouse', { ns: 'pages/employeeDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${(summaryData.paidToHouse || 0).toFixed(2)}</Typography></Grid>
                <Grid item xs={12} sm={3}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('owedToEmployee', { ns: 'pages/employeeDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${(summaryData.owedToEmployee || 0).toFixed(2)}</Typography></Grid>
            </Grid>
        ) : (
            <Grid key="received-tips-summary" container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={12}><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t('totalReceivedTips', { ns: 'pages/employeeDashboard' })}:</strong></Typography><Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}>${(summaryData.totalReceived || 0).toFixed(2)}</Typography></Grid>
            </Grid>
        )}
      </Paper>

      {user?.can_cash_out && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} direction={isMobile ? "column" : "row"}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth={isMobile}
                onClick={() => setIsDeclareTipModalOpen(true)}
              >
                {t("declareTips", { ns: "pages/serverDashboard" })}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth={isMobile}
                onClick={() => navigate("/employee/dashboard/cashout-history")}
              >
                {t("viewCashOutHistory", { ns: "pages/employeeDashboard" })}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {user?.can_cash_out && loading ? (
        <CircularProgress />
      ) : user?.can_cash_out && processedCashOut ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={3} key={latestCashOut?.id}>
              <CardHeader
                avatar={<AttachMoneyIcon color="primary" />}
                title={
                  <Typography variant={isMobile ? "subtitle1" : "h6"} component="h2">
                    {t("latestCashOutSummary", { ns: "pages/employeeDashboard" })}
                  </Typography>
                }
                action={
                  <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </ExpandMore>
                }
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t("serviceDate", { ns: "pages/employeeDashboard" })}:
                  </strong> {dayjs.utc(processedCashOut.service_date).format("YYYY-MM-DD")}</Typography>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t("totalSales", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.total_sales.toFixed(2)}</Typography>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t("cashOnHand", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.cash_on_hand.toFixed(2)}</Typography>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{t("totalTipOuts", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.totalTipOuts.toFixed(2)}</Typography>
                <Typography variant={isMobile ? "body2" : "h6"} sx={{ mt: 1 }}><strong>{t("dueBack", { ns:
                  "pages/serverDashboard" })}:</strong> ${processedCashOut.dueBack.toFixed(2)}</Typography>

                {processedCashOut.dueBack > 0 && (
                  <Typography align="center" sx={{ backgroundColor: 'red', color: 'white', p: 1, mt: 1,
                    borderRadius: 1 }}>
                    {t('dueBackPositiveMessage', { ns: 'pages/serverDashboard', amount: `${Math
                      .abs(processedCashOut.dueBack).toFixed(2)}` })}
                  </Typography>
                )}
                {processedCashOut.dueBack < 0 && (
                  <Typography align="center" sx={{ backgroundColor: 'green', color: 'white', p: 1, mt: 1
                    , borderRadius: 1 }}>
                    {t('dueBackNegativeMessage', { ns: 'pages/serverDashboard', amount: `${Math
                      .abs(processedCashOut.dueBack).toFixed(2)}` })}
                  </Typography>
                )}
                {processedCashOut.dueBack === 0 && (
                  <Typography align="center" sx={{ backgroundColor: 'orange', color: 'white', p: 1, mt:
                    1, borderRadius: 1 }}>
                    {t('dueBackZeroMessage', { ns: 'pages/serverDashboard' })}
                  </Typography>
                )}
              </CardContent>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                  <Typography variant={isMobile ? "subtitle1" : "h6"}>{t('tipDistributionDetails', { ns: 'pages/serverDashboard'
                    })}</Typography>
                  <Divider sx={{ my: 1 }} />
                  {processedCashOut.details.map((detail, index) => (
                    <Box key={index} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black' }}><strong>{detail.ruleName}:</strong> ${detail.
                        amount.toFixed(2)}</Typography>
                      {detail.type === 'individual' && detail.recipients?.map((recipient, recIndex)=> (
                          <Typography key={recIndex} variant={isMobile ? "body2" : "body1"} sx={{ ml: 2, color: 'black' }}>- {recipient.
                            name}: ${recipient.amount.toFixed(2)}</Typography>
                        ))}
                    </Box>
                  ))}
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        </Grid>
      ) : user?.can_cash_out && !latestCashOut && !loading ? (
        <Alert severity="info">{t("noRecentCashOuts", { ns: "pages/employeeDashboard" })}</Alert>
      ) : !user?.can_cash_out && loading ? (
        <CircularProgress />
      ) : !user?.can_cash_out && receivedTips.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                avatar={<AttachMoneyIcon color="primary" />}
                title={
                  <Typography variant={isMobile ? "subtitle1" : "h6"} component="h2">
                    {t("myReceivedTips", { ns: "pages/employeeDashboard" })}
                  </Typography>
                }
                sx={{ pb: 0 }}
              />
              <CardContent>
                {groupedByDateAndRole.length > 0 && (() => {
                    const [date, { roles, dayTotal }] = groupedByDateAndRole[0];
                    return (
                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                            <Typography variant={isMobile ? "subtitle2" : "h6"} component="h3" sx={{ mb: 1, color: 'black' }}>{date}</Typography>
                            <Divider />
                            {Object.entries(roles).map(([role, { tips, total }], roleIndex) => (
                                <Box key={roleIndex} sx={{ my: 1 }}>
                                    <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black', fontWeight: 'bold' }}>
                                        {role.startsWith('Tip-Out received from ')
                                            ? role.replace('Tip-Out received from ', '')
                                            : role}
                                        : ${total.toFixed(2)}
                                    </Typography>
                                    {tips.map((tip, tipIndex) => (
                                        tip.source === 'individual' && (
                                            <Typography key={tipIndex} variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ fontStyle: 'italic', ml: 2 }}>
                                                From: {tip.sender_first_name} {tip.sender_last_name} (${Number(tip.distributed_amount).toFixed(2)})
                                            </Typography>
                                        )
                                    ))}
                                </Box>
                            ))}
                            <Divider />
                            <Box sx={{ mt: 1, textAlign: 'right' }}>
                                <Typography variant={isMobile ? "subtitle1" : "h6"} component="p" sx={{ fontWeight: 'bold', color: 'black' }}>
                                    Total: ${dayTotal.toFixed(2)}
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : !user?.can_cash_out && receivedTips.length === 0 && !loading ? (
        <Alert severity="info">{t("noReceivedTips", { ns: "pages/employeeDashboard" })}</Alert>
      ) : null}

      {/* Other components... */}

      <DeclareTipModal
        open={isDeclareTipModalOpen}
        onClose={() => setIsDeclareTipModalOpen(false)}
        onTipDeclared={() => {
          fetchEmployeeDashboardData();
        }} // Refetch data after tip declared
        currentUser={user}
        openPeriod={openPeriod}
      />
    </Box>
  );
};

export default EmployeeOverview;