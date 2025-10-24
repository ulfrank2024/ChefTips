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
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getCashOutsByCollector,
  getEmployeeReceivedTips,
  getPoolDetails,
} from "../../api/tipApi";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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

const EmployeeOverview = () => {
  const { t } = useTranslation(["common", "pages/employeeDashboard", "pages/serverDashboard"]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [receivedTips, setReceivedTips] = useState([]);
  const [latestCashOut, setLatestCashOut] = useState(null);
  const [latestPool, setLatestPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCashOut, setLoadingCashOut] = useState(false);
  const [loadingLatestPool, setLoadingLatestPool] = useState(false);
  const [error, setError] = useState("");
  const [isDeclareTipModalOpen, setIsDeclareTipModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const fetchEmployeeDashboardData = async () => {
    setLoading(true);
    try {
      if (user && user.id) {
        if (user.can_cash_out) {
          setLoadingCashOut(true);
          const cashOuts = await getCashOutsByCollector(user.id, dayjs().subtract(1, 'month').format(
            'YYYY-MM-DD'), dayjs().format('YYYY-MM-DD'));
          if (cashOuts.length > 0) {
            const sortedCashOuts = cashOuts.sort((a, b) => dayjs(b.service_date).unix() - dayjs(a.service_date
            ).unix());
            setLatestCashOut(sortedCashOuts[0]);
          }
          setLoadingCashOut(false);
        }

        const tips = await getEmployeeReceivedTips(user.id);
        setReceivedTips(tips);

        if (tips.length > 0) {
          const sortedTips = tips.sort((a, b) => dayjs(b.pool_created_at).unix() - dayjs(a.pool_created_at).
            unix());
          const latestPoolId = sortedTips[0].pool_id;
          setLoadingLatestPool(true);
          const poolDetails = await getPoolDetails(latestPoolId);
          const employeeDistribution = poolDetails.distributions.find((dist) => dist.user_id === user.id);
          const latestPoolWithEmployeeAmount = {
            ...poolDetails,
            employeeDistributedAmount: employeeDistribution ? employeeDistribution.distributed_amount : 0,
          };
          setLatestPool(latestPoolWithEmployeeAmount);
          setLoadingLatestPool(false);
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
  }, [user, t]);

  const processedCashOut = useMemo(() => {
    if (!latestCashOut) return null;

    const adjustments = latestCashOut.adjustments || [];
    const tipOuts = adjustments.filter(adj => adj.adjustment_type === 'TIP_OUT_AUTOMATIC' && adj.amount < 0);
    const totalTipOuts = tipOuts.reduce((sum, adj) => sum + Math.abs(Number(adj.amount) || 0), 0);

    const details = tipOuts.map(adj => {
      const recipients = adjustments.filter(r => r.rule_id === adj.rule_id && r.amount > 0);
      return {
        ruleName: adj.description.replace('Tip-Out to ', ''),
        amount: Math.abs(Number(adj.amount) || 0),
        recipients: recipients.map(r => ({
          name: r.description.replace('Tip-Out received from ', ''), // A better name source might be needed
          amount: Number(r.amount) || 0,
        })),
        type: recipients.length > 0 ? 'individual' : 'department',
      };
    });

    return {
      ...latestCashOut,
      total_sales: Number(latestCashOut.total_sales) || 0,
      cash_on_hand: Number(latestCashOut.cash_on_hand) || 0,
      totalTipOuts,
      details,
      dueBack: Number(latestCashOut.final_balance) || 0,
    };
  }, [latestCashOut]);


  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t("overview", { ns: "pages/employeeDashboard" })}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h6" gutterBottom>
            {t("welcome", { ns: "common" })},{" "}
            {user?.first_name || "Employee"}!
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <BusinessIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1" color="text.secondary">
            {user?.company_name}
          </Typography>
        </Box>
      </Paper>

      {user?.can_cash_out && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
            onClick={() => setIsDeclareTipModalOpen(true)}
          >
            {t("declareTips", { ns: "pages/serverDashboard" })}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/employee/dashboard/cashout-history")}
          >
            {t("viewCashOutHistory", { ns: "pages/employeeDashboard" })}
          </Button>
        </Box>
      )}

      {user?.can_cash_out && loadingCashOut ? (
        <CircularProgress />
      ) : user?.can_cash_out && processedCashOut ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                avatar={<AttachMoneyIcon color="primary" />}
                title={
                  <Typography variant="h6" component="h2">
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
                <Typography variant="body1"><strong>{t("serviceDate", { ns: "pages/employeeDashboard" })}:
                  </strong> {dayjs(processedCashOut.service_date).format("YYYY-MM-DD")}</Typography>
                <Typography variant="body1"><strong>{t("totalSales", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.total_sales.toFixed(2)}</Typography>
                <Typography variant="body1"><strong>{t("cashOnHand", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.cash_on_hand.toFixed(2)}</Typography>
                <Typography variant="body1"><strong>{t("totalTipOuts", { ns: "pages/serverDashboard" })}:
                  </strong> ${processedCashOut.totalTipOuts.toFixed(2)}</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}><strong>{t("dueBack", { ns:
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
                  <Typography variant="h6">{t('tipDistributionDetails', { ns: 'pages/serverDashboard'
                    })}</Typography>
                  <Divider sx={{ my: 1 }} />
                  {processedCashOut.details.map((detail, index) => (
                    <Box key={index} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2"><strong>{detail.ruleName}:</strong> ${detail.
                        amount.toFixed(2)}</Typography>
                      {detail.type === 'individual' && detail.recipients?.map((recipient, recIndex)=> (
                          <Typography key={recIndex} variant="body2" sx={{ ml: 2 }}>- {recipient.
                            name}: ${recipient.amount.toFixed(2)}</Typography>
                        ))}
                      {detail.type === 'department' && (
                        <Typography variant="body2" sx={{ ml: 2 }}>- {t('kitchenPool', { ns:
                          'pages/serverDashboard' })}: ${detail.amount.toFixed(2)}</Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        </Grid>
      ) : user?.can_cash_out && !latestCashOut && !loadingCashOut ? (
        <Alert severity="info">{t("noRecentCashOuts", { ns: "pages/employeeDashboard" })}</Alert>
      ) : null}

      {/* Other components... */}

      <DeclareTipModal
        open={isDeclareTipModalOpen}
        onClose={() => setIsDeclareTipModalOpen(false)}
        onTipDeclared={fetchEmployeeDashboardData} // Refetch data after tip declared
        currentUser={user}
      />
    </Box>
  );
};

export default EmployeeOverview;