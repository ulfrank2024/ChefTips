import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {  Box, Typography, Paper, CircularProgress, Alert, Grid, List, ListItem, ListItemText, useTheme, useMediaQuery, Card, CardHeader, CardContent, Divider} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupIcon from '@mui/icons-material/Group'; // Icon for employees by department
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPools, getTipOutRules, getEmployeeReceivedTips } from '../../api/tipApi'; // Import getTipOutRules
import { getCompanyEmployees, getCompanyCategories } from '../../api/authApi'; // Import getCompanyCategories
import { getPayoutPeriods } from '../../api/payoutPeriodApi'; // Import getPayoutPeriods
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

dayjs.extend(utc);


// Register Chart.js components and plugin
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels
);

const Overview = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard', "pages/employeeDashboard"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [pools, setPools] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [payoutPeriods, setPayoutPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receivedTips, setReceivedTips] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); // Use empty string for "All Months"
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { filteredPools, years, months } = React.useMemo(() => {
    let currentFilteredPools = pools;

    // Filter by year
    if (selectedYear) {
      currentFilteredPools = currentFilteredPools.filter(pool => new Date(pool.start_date).getFullYear() === selectedYear);
    }

    // Filter by month
    if (selectedMonth) {
      currentFilteredPools = currentFilteredPools.filter(pool => new Date(pool.start_date).getMonth() + 1 === parseInt(selectedMonth));
    }

    const uniqueYears = Array.from(new Set(pools.map(pool => new Date(pool.start_date).getFullYear()))).sort((a, b) => b - a);
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

    return { filteredPools: currentFilteredPools.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)), years: uniqueYears, months: allMonths };
  }, [pools, selectedYear, selectedMonth, t]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [poolsData, employeesData, rulesData, periodsData, tipsData, categoriesData] = await Promise.all([
          getPools(),
          getCompanyEmployees(),
          getTipOutRules(),
          getPayoutPeriods(),
          getEmployeeReceivedTips(user.id),
          getCompanyCategories(),
        ]);
        const sortedPools = poolsData.sort((a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix());
        setPools(sortedPools);
        setEmployees(employeesData);
        setCategories(categoriesData);
        setRules(rulesData);
        setPayoutPeriods(periodsData);
        setReceivedTips(tipsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const groupedByDateAndCategory = useMemo(() => {
    const dateGroups = {};
    receivedTips.forEach(tip => {
        const date = dayjs.utc(tip.start_date).format('YYYY-MM-DD');
        if (!dateGroups[date]) {
            dateGroups[date] = {
                categories: {},
                dayTotal: 0,
            };
        }

        const category = tip.category_name || 'Uncategorized';
        if (!dateGroups[date].categories[category]) {
            dateGroups[date].categories[category] = {
                tips: [],
                total: 0,
            };
        }

        dateGroups[date].categories[category].tips.push(tip);
        dateGroups[date].categories[category].total += Number(tip.distributed_amount);
        dateGroups[date].dayTotal += Number(tip.distributed_amount);
    });

    return Object.entries(dateGroups).sort(([dateA], [dateB]) => dayjs.utc(dateB).unix() - dayjs.utc(dateA).unix());
  }, [receivedTips]);

  // Prepare data for the chart
  const chartData = {
    labels: filteredPools.map(pool => dayjs(pool.start_date).format('YYYY-MM-DD')),
    datasets: [
      {
        label: t('amount', { ns: 'pages/managerDashboard' }),
        data: filteredPools.map(pool => Number(pool.total_amount)),
        borderColor: 'rgb(136, 132, 216)',
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill parent container
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('poolHistoryChartTitle', { ns: 'pages/managerDashboard' }),
      },
      datalabels: { // Configure datalabels plugin
        display: true, // Re-enabled display
        color: 'black',
        align: 'end',
        anchor: 'end',
        padding: 5,
        formatter: function(value) {
          return value.toFixed(2) + ' $';
        },
        font: {
          size: 10 // Reduce font size
        }
      }
    },
    scales: {
      x: {
        offset: true, // Added offset
        title: {
          display: true,
          text: t('date', { ns: 'pages/managerDashboard' }),
        },
        ticks: {
          autoSkipPadding: 20, // Add padding between labels
          maxRotation: 45, // Rotate labels if needed
          minRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text: t('amount', { ns: 'pages/managerDashboard' }),
        },
        ticks: {
          stepSize: 100,
        },
      },
    },
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const lastPool = pools.length > 0 ? pools[pools.length - 1] : null;
  const openPeriod = payoutPeriods.find(p => p.status === 'CURRENT');

  const employeesByCategory = useMemo(() => {
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = { name: cat.name, employees: [] };
    });
    
    employees.forEach(emp => {
      if (emp.category_id && categoryMap[emp.category_id]) {
        categoryMap[emp.category_id].employees.push(emp);
      }
    });

    return Object.values(categoryMap).filter(cat => cat.employees.length > 0);
  }, [employees, categories]);

  const emptyStateStyle = {
    p: 2,
    backgroundColor: 'grey.200',
    color: 'black',
    borderRadius: 1,
    textAlign: 'center',
  };

  return (
      <Box>
          <Paper
              elevation={3}
              sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 4 }}
          >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography
                      variant={isMobile ? "h6" : "h5"}
                      component="h1"
                      sx={{ fontWeight: "bold" }}
                  >
                      {user?.company_name}
                  </Typography>
              </Box>
              <Box
                  sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexDirection: isMobile ? "column" : "row",
                      mb: 2,
                  }}
              >
                  <Box
                      sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: isMobile ? 2 : 0,
                      }}
                  >
                      <PersonIcon sx={{ mr: 1 }} />
                      <Typography variant={isMobile ? "subtitle1" : "h6"}>
                          {t("welcome", { ns: "common" })},{" "}
                          {user?.first_name || "Manager"}!
                      </Typography>
                  </Box>
                  {user?.can_cash_out && (
                    <Button
                        variant="contained"
                        onClick={() => navigate("/dashboard/declare-tips")}
                        sx={{ backgroundColor: "#1b2646" }}
                    >
                        {t("declareTips", { ns: "pages/managerDashboard" })}
                    </Button>
                  )}
              </Box>
              {openPeriod && (
                  <Box
                      sx={{
                          mt: 2,
                          p: 2,
                          border: "1px solid #ddd",
                          borderRadius: 2,
                          backgroundColor: "#f9f9f9",
                      }}
                  >
                      <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", mb: 2 }}
                      >
                          {t("activePayoutPeriod", {
                              ns: "pages/managerDashboard",
                          })}
                      </Typography>
                      <Grid container spacing={2}>
                          <Grid
                              item
                              xs={12}
                              sm={4}
                              sx={{ display: "flex", alignItems: "center" }}
                          >
                              <PlayCircleOutlineIcon
                                  sx={{ mr: 1, color: "primary.main" }}
                              />
                              <Typography
                                  sx={{
                                      color: "black",
                                  }}
                              >
                                  <strong>{openPeriod.name}</strong>
                              </Typography>
                          </Grid>
                          <Grid
                              item
                              xs={12}
                              sm={4}
                              sx={{ display: "flex", alignItems: "center" }}
                          >
                              <EventAvailableIcon
                                  sx={{ mr: 1, color: "success.main" }}
                              />
                              <Typography
                                  sx={{
                                      color: "black",
                                  }}
                              >
                                  <strong>
                                      {t("start", {
                                          ns: "pages/managerDashboard",
                                      })}
                                      :
                                  </strong>{" "}
                                  {dayjs.utc(openPeriod.start_date).format(
                                      "YYYY-MM-DD"
                                  )}
                              </Typography>
                          </Grid>
                          <Grid
                              item
                              xs={12}
                              sm={4}
                              sx={{ display: "flex", alignItems: "center" }}
                          >
                              <EventBusyIcon
                                  sx={{ mr: 1, color: "error.main" }}
                              />
                              <Typography
                                  sx={{
                                      color: "black",
                                  }}
                              >
                                  <strong>
                                      {t("end", {
                                          ns: "pages/managerDashboard",
                                      })}
                                      :
                                  </strong>{" "}
                                  {dayjs.utc(openPeriod.end_date).format(
                                      "YYYY-MM-DD"
                                  )}
                              </Typography>
                          </Grid>
                      </Grid>
                  </Box>
              )}
          </Paper>

          <Grid
              container
              spacing={isMobile ? 2 : 3}
              sx={{ mb: isMobile ? 2 : 4 }}
          >
              {lastPool && (
                  <Grid item xs={12} md={4}>
                      <Paper
                          elevation={3}
                          sx={{ p: isMobile ? 2 : 3, height: "100%" }}
                      >
                          <Box
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 2,
                              }}
                          >
                              <AccessTimeIcon sx={{ mr: 1 }} />
                              <Typography
                                  variant={isMobile ? "subtitle1" : "h6"}
                                  component="h2"
                              >
                                  {t("lastPoolCreated", {
                                      ns: "pages/managerDashboard",
                                  })}
                              </Typography>
                          </Box>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <BusinessIcon sx={{ mr: 1, fontSize: "small" }} />
                              {t("category", { ns: 'components/manager/manageEmployees' })}: {lastPool.category_name}
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <ScheduleIcon sx={{ mr: 1, fontSize: "small" }} />
                              {t("period", {
                                  ns: "pages/managerDashboard",
                              })}
                              :{" "}
                              {dayjs(lastPool.start_date).format("YYYY-MM-DD")}{" "}
                              - {dayjs(lastPool.end_date).format("YYYY-MM-DD")}
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <AccessTimeIcon
                                  sx={{ mr: 1, fontSize: "small" }}
                              />
                              {t("creationDate", {
                                  ns: "pages/managerDashboard",
                              })}
                              :{" "}
                              {dayjs(lastPool.created_at).format(
                                  "YYYY-MM-DD HH:mm"
                              )}
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <AttachMoneyIcon
                                  sx={{ mr: 1, fontSize: "small" }}
                              />
                              {t("totalAmount")}:{" "}
                              {Number(lastPool.total_amount).toFixed(2)} $
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <PeopleIcon sx={{ mr: 1, fontSize: "small" }} />
                              {t("recipientCount")}:{" "}
                              {lastPool.recipient_count || 0}
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <ScheduleIcon sx={{ mr: 1, fontSize: "small" }} />
                              {t("totalDistributedHours")}:{" "}
                              {Number(lastPool.total_distributed_hours).toFixed(
                                  2
                              )}
                          </Typography>
                          <Typography
                              variant={isMobile ? "body2" : "body1"}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  color: "black",
                              }}
                          >
                              <SpeedIcon sx={{ mr: 1, fontSize: "small" }} />
                              {t("ratePerHour")}:{" "}
                              {(
                                  Number(lastPool.total_amount) /
                                  (Number(lastPool.total_distributed_hours) ||
                                      1)
                              ).toFixed(2)}{" "}
                              $
                          </Typography>
                      </Paper>
                  </Grid>
              )}
              
              {groupedByDateAndCategory.length > 0 && (
                <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{height: "100%"}}>
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
                        {(() => {
                            const [date, { categories, dayTotal }] = groupedByDateAndCategory[0];
                            return (
                                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                    <Typography variant={isMobile ? "subtitle2" : "h6"} component="h3" sx={{ mb: 1, color: 'black' }}>{date}</Typography>
                                    <Divider />
                                    {Object.entries(categories).map(([category, { tips, total }], catIndex) => (
                                        <Box key={catIndex} sx={{ my: 1 }}>
                                            <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'black', fontWeight: 'bold' }}>
                                                {category}: ${total.toFixed(2)}
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
                )}

              <Grid item xs={12} md={lastPool ? 4 : 12}>
                  <Paper
                      elevation={3}
                      sx={{ p: isMobile ? 2 : 3, height: "100%" }}
                  >
                      <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                          <GroupIcon sx={{ mr: 1 }} />
                          <Typography
                              variant={isMobile ? "subtitle1" : "h6"}
                              component="h2"
                          >
                              {t("employeesByCategory", { ns: "pages/managerDashboard"})}
                          </Typography>
                      </Box>
                      {employeesByCategory.length === 0 ? (
                          <Typography variant="body1" sx={emptyStateStyle}>
                              {t("noCategoriesYet", { ns: "pages/managerDashboard"})}
                          </Typography>
                      ) : (
                          <List>
                              {employeesByCategory.map((catEntry) => (
                                  <Box key={catEntry.name} sx={{ mb: 2 }}>
                                      <Typography
                                          variant="subtitle1"
                                          sx={{ fontWeight: "bold" }}
                                      >
                                          {catEntry.name} ({catEntry.employees.length || 0}{" "}
                                          {t("employees", {
                                              ns: "common",
                                              count:
                                                  catEntry.employees.length ||
                                                  0,
                                          })}
                                          )
                                      </Typography>
                                      <List
                                          dense
                                          disablePadding
                                          sx={{
                                              maxHeight: 150,
                                              overflow: "auto",
                                          }}
                                      >
                                          {catEntry.employees.length === 0 ? (
                                              <ListItem>
                                                  <ListItemText
                                                      primary={t(
                                                          "noEmployeesInCategory",
                                                          {
                                                              ns: "pages/managerDashboard",
                                                          }
                                                      )}
                                                  />
                                              </ListItem>
                                          ) : (
                                              catEntry.employees.map((emp) => (
                                                  <ListItem key={emp.id}>
                                                      <ListItemText
                                                          primary={`${emp.first_name} ${emp.last_name}`}
                                                      />
                                                  </ListItem>
                                              ))
                                          )}
                                      </List>
                                  </Box>
                              ))}
                          </List>
                      )}
                  </Paper>
              </Grid>

              <Grid item xs={12} md={12}>
                  <Paper
                      elevation={3}
                      sx={{ p: isMobile ? 2 : 3, height: "100%" }}
                  >
                      <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                          <AttachMoneyIcon sx={{ mr: 1 }} />
                          <Typography
                              variant={isMobile ? "subtitle1" : "h6"}
                              component="h2"
                          >
                              {t("tipOutRules", {
                                  ns: "pages/managerDashboard",
                              })}
                          </Typography>
                      </Box>
                      {rules.length === 0 ? (
                          <Typography variant="body1" sx={emptyStateStyle}>
                              {t("noTipOutRules", {
                                  ns: "pages/managerDashboard",
                              })}
                          </Typography>
                      ) : (
                          <Box
                              sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "space-between",
                                  gap: "16px",
                              }}
                          >
                              {rules.map((rule) => (
                                  <Box
                                      key={rule.id}
                                      sx={{
                                          flexBasis: isMobile
                                              ? "100%"
                                              : "calc(50% - 8px)",
                                          maxWidth: isMobile
                                              ? "100%"
                                              : "calc(50% - 8px)",
                                          backgroundColor: "#2a2a3e",
                                          padding: 2,
                                          borderRadius: "10px",
                                          mb: 1,
                                          height: "100%",
                                      }}
                                  >
                                      <Typography
                                          sx={{
                                              color: "#fff",
                                              fontWeight: "bold",
                                              fontSize: isMobile
                                                  ? "0.8rem"
                                                  : "1rem",
                                          }}
                                      >
                                          {rule.name}
                                      </Typography>
                                      <Typography
                                          sx={{
                                              color: "#ccc",
                                              fontSize: isMobile
                                                  ? "0.7rem"
                                                  : "0.875rem",
                                          }}
                                      >
                                          {rule.percentage
                                              ? `${rule.percentage}%`
                                              : `${rule.flat_amount}$`}
                                          {rule.calculation_basis ===
                                          "total_sales"
                                              ? ` ${t("ofTotalSales", {
                                                    ns: "pages/managerDashboard",
                                                })}`
                                              : ` ${t("ofGrossTips", {
                                                    ns: "pages/managerDashboard",
                                                })}`}
                                      </Typography>
                                  </Box>
                              ))}
                          </Box>
                      )}
                  </Paper>
              </Grid>
          </Grid>

          <Paper
              elevation={3}
              sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 4 }}
          >
              <Box
                  sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                  }}
              >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BarChartIcon sx={{ mr: 1 }} />
                      <Typography
                          variant={isMobile ? "subtitle1" : "h6"}
                          component="h2"
                      >
                          {t("poolHistoryChartTitle", {
                              ns: "pages/managerDashboard",
                          })}
                      </Typography>
                  </Box>
                  <Button
                      variant="contained"
                      onClick={() => setIsFilterModalOpen(true)}
                  >
                      {t("filter")}
                  </Button>
              </Box>
              {filteredPools.length === 0 ? (
                  <Typography variant="body1" sx={emptyStateStyle}>
                      {t("noPoolsYet", { ns: "pages/managerDashboard" })}
                  </Typography>
              ) : (
                  <Box sx={{ height: isMobile ? 300 : 400, width: "100%" }}>
                      <Line options={chartOptions} data={chartData} />
                  </Box>
              )}
          </Paper>

          <Dialog
              open={isFilterModalOpen}
              onClose={() => setIsFilterModalOpen(false)}
              maxWidth="xs"
              fullWidth
          >
              <DialogTitle>{t("filter")}</DialogTitle>
              <DialogContent>
                  <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
                      <InputLabel>{t("year")}</InputLabel>
                      <Select
                          value={selectedYear}
                          label={t("year")}
                          onChange={(e) => setSelectedYear(e.target.value)}
                      >
                          {years.map((year) => (
                              <MenuItem key={year} value={year}>
                                  {year}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                      <InputLabel>{t("month")}</InputLabel>
                      <Select
                          value={selectedMonth}
                          label={t("month")}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                          {months.map((month) => (
                              <MenuItem key={month.value} value={month.value}>
                                  {month.label}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
              </DialogContent>
              <DialogActions>
                  <Button onClick={() => setIsFilterModalOpen(false)}>
                      {t("cancel")}
                  </Button>
                  <Button
                      onClick={() => {
                          setIsFilterModalOpen(false);
                      }}
                  >
                      {t("apply")}
                  </Button>
              </DialogActions>
          </Dialog>
      </Box>
  );
};

export default Overview;