import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {  Box, Typography, Paper, CircularProgress, Alert, Grid, List, ListItem, ListItemText, useTheme, useMediaQuery} from '@mui/material';
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
import { getPools, getTipOutRules } from '../../api/tipApi'; // Import getTipOutRules
import { getCompanyEmployees } from '../../api/authApi'; // Import getCompanyEmployees
import { getPayoutPeriods } from '../../api/payoutPeriodApi'; // Import getPayoutPeriods
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';


// Register Chart.js components and plugin
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels
);

const Overview = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [pools, setPools] = useState([]);
  const [employees, setEmployees] = useState([]);     // New state for employees
  const [rules, setRules] = useState([]);             // New state for tip-out rules
  const [payoutPeriods, setPayoutPeriods] = useState([]); // New state for payout periods
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(''); // Use empty string for "All Months"
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const predefinedRoles = ['CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'];

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
        const [poolsData, employeesData, rulesData, periodsData] = await Promise.all([
          getPools(),
          getCompanyEmployees(),
          getTipOutRules(), // Fetch tip-out rules
          getPayoutPeriods()
        ]);
        // Sort pools by created_at for chronological display in chart and to get the last created
        const sortedPools = poolsData.sort((a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix());
        setPools(sortedPools);
        setEmployees(employeesData);
        setRules(rulesData);          // Set rules state
        setPayoutPeriods(periodsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

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

  const lastPool = pools.length > 0 ? pools[pools.length - 1] : null; // Get the last created pool
  const openPeriod = payoutPeriods.find(p => p.status === 'OPEN');

  // Group employees by role
  const employeesByRole = {};

  // Initialize with all predefined roles
  predefinedRoles.forEach(role => {
    employeesByRole[role] = {
      name: t(role.toLowerCase(), { ns: 'components/manager/manageRules' }),
      employees: []
    };
  });

  employees.forEach(emp => {
    if (emp.role && employeesByRole[emp.role]) {
      employeesByRole[emp.role].employees.push(emp);
    }
  });

  // Convert to an array for rendering, filtering out empty roles if desired
  const rolesWithEmployees = Object.values(employeesByRole).filter(roleEntry => roleEntry.employees.length > 0);

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
                                  {dayjs(openPeriod.start_date).format(
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
                                  {dayjs(openPeriod.end_date).format(
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
                  <Grid item xs={12} md={6}>
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
                              {t("role", {
                                  ns: "pages/managerDashboard",
                              })}
                              :{" "}
                              {t(lastPool.department_name.toLowerCase(), {
                                  ns: "components/manager/manageRules",
                              })}
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

              <Grid item xs={12} md={lastPool ? 6 : 12}>
                  {" "}
                  {/* Takes remaining space or full width if no lastPool */}
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
                              {t("employeesByRole", {
                                  ns: "pages/managerDashboard",
                              })}{" "}
                              {/* New translation key */}
                          </Typography>
                      </Box>
                      {rolesWithEmployees.length === 0 ? (
                          <Typography variant="body1" sx={emptyStateStyle}>
                              {t("noRolesYet", {
                                  ns: "pages/managerDashboard",
                              })}
                          </Typography> /* New translation key */
                      ) : (
                          <List>
                              {rolesWithEmployees.map((roleEntry) => (
                                  <Box key={roleEntry.name} sx={{ mb: 2 }}>
                                      <Typography
                                          variant="subtitle1"
                                          sx={{ fontWeight: "bold" }}
                                      >
                                          {roleEntry.name} (
                                          {roleEntry.employees.length || 0}{" "}
                                          {t("employees", {
                                              ns: "common",
                                              count:
                                                  roleEntry.employees.length ||
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
                                          {roleEntry.employees.length === 0 ? (
                                              <ListItem>
                                                  <ListItemText
                                                      primary={t(
                                                          "noEmployeesInRole",
                                                          {
                                                              ns: "pages/managerDashboard",
                                                          }
                                                      )}
                                                  />
                                              </ListItem> /* New translation key */
                                          ) : (
                                              roleEntry.employees.map((emp) => (
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
                  {" "}
                  {/* New Grid item for Tip-Out Rules, takes full width on desktop */}{" "}
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
                              })}{" "}
                              {/* New translation key */}
                          </Typography>
                      </Box>
                      {rules.length === 0 ? (
                          <Typography variant="body1" sx={emptyStateStyle}>
                              {t("noTipOutRules", {
                                  ns: "pages/managerDashboard",
                              })}
                          </Typography> /* New translation key */
                      ) : (
                          <Box
                              sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "space-between",
                                  gap: "16px",
                              }}
                          >
                              {" "}
                              {/* Added gap for spacing */}
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
                                      {" "}
                                      {/* Adjusted flexBasis and maxWidth for two columns with gap */}
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