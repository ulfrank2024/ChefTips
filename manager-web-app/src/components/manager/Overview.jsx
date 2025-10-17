import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, CircularProgress, Alert, Grid, List, ListItem, ListItemText
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupIcon from '@mui/icons-material/Group'; // Icon for employees by department
import { useAuth } from '../../context/AuthContext.jsx';
import { getPools, getDepartments, getCategories } from '../../api/tipApi'; // Import getDepartments and getCategories
import { getCompanyEmployees } from '../../api/authApi'; // Import getCompanyEmployees
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';

// Register Chart.js components and plugin
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels
);

const Overview = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard']);
  const { user } = useAuth();

  const [pools, setPools] = useState([]);
  const [departments, setDepartments] = useState([]); // New state for departments
  const [employees, setEmployees] = useState([]);     // New state for employees
  const [categories, setCategories] = useState([]);   // New state for categories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const [poolsData, departmentsData, employeesData, categoriesData] = await Promise.all([
          getPools(),
          getDepartments(),
          getCompanyEmployees(),
          getCategories() // Fetch categories
        ]);
        // Sort pools by created_at for chronological display in chart and to get the last created
        const sortedPools = poolsData.sort((a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix());
        setPools(sortedPools);
        setDepartments(departmentsData);
        setEmployees(employeesData);
        setCategories(categoriesData); // Set categories state
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
          return value.toFixed(2) + ' $'; // Corrected string literal
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

  // Group employees by department
  const employeesByDepartment = {};

  // Initialize with all actual departments
  departments.forEach(dept => {
    employeesByDepartment[dept.id] = {
      name: dept.name,
      employees: []
    };
  });

  // Add a special entry for unassigned/collectors
  employeesByDepartment['unassigned'] = {
    name: t('unassignedEmployees', { ns: 'pages/managerDashboard' }), // Need translation key
    employees: []
  };

  employees.forEach(emp => {
    if (emp.category_id) {
      const employeeCategory = categories.find(cat => cat.id === emp.category_id);
      if (employeeCategory && employeeCategory.department_id) {
        if (employeesByDepartment[employeeCategory.department_id]) {
          employeesByDepartment[employeeCategory.department_id].employees.push(emp);
        } else {
          // Category found but department not in current list (e.g., filtered out or inconsistent data)
          employeesByDepartment['unassigned'].employees.push(emp);
        }
      }
    } else {
      // No category_id assigned (e.g., daily collectors)
      employeesByDepartment['unassigned'].employees.push(emp);
    }
  });

  // Convert to an array for rendering, filtering out empty departments if desired
  const departmentsWithEmployees = Object.values(employeesByDepartment).filter(dept => dept.employees.length > 0 || dept.id === 'unassigned'); // Keep unassigned even if empty

  return (
    <Box>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
                    {user?.company_name}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                    {t('welcome', { ns: 'common' })}, {user?.first_name || 'Manager'}!
                </Typography>
            </Box>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 4 }}>
            {lastPool && (
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccessTimeIcon sx={{ mr: 1 }} />
                            <Typography variant="h6" component="h2">
                                {t('lastPoolCreated', { ns: 'pages/managerDashboard' })}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <BusinessIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('department', { ns: 'pages/managerDashboard' })}: {lastPool.department_name}
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('period', { ns: 'pages/managerDashboard' })}: {dayjs(lastPool.start_date).format('YYYY-MM-DD')} - {dayjs(lastPool.end_date).format('YYYY-MM-DD')}
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <AccessTimeIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('creationDate', { ns: 'pages/managerDashboard' })}: {dayjs(lastPool.created_at).format('YYYY-MM-DD HH:mm')}
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <AttachMoneyIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('totalAmount')}: {Number(lastPool.total_amount).toFixed(2)} $
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <PeopleIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('recipientCount')}: {lastPool.recipient_count || 0}
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('totalDistributedHours')}: {Number(lastPool.total_distributed_hours).toFixed(2)}
                        </Typography>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'black' }}>
                            <SpeedIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {t('ratePerHour')}: {(Number(lastPool.total_amount) / (Number(lastPool.total_distributed_hours) || 1)).toFixed(2)} $
                        </Typography>
                    </Paper>
                </Grid>
            )}

            <Grid item xs={12} md={lastPool ? 6 : 12}> {/* Takes remaining space or full width if no lastPool */}
                <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h2">
                            {t('employeesByDepartment', { ns: 'pages/managerDashboard' })}
                        </Typography>
                    </Box>
                    {departments.length === 0 ? (
                        <Typography variant="body1">{t('noDepartmentsYet', { ns: 'pages/managerDashboard' })}</Typography>
                    ) : (
                        <List>
                            {departmentsWithEmployees.map(dept => (
                                <Box key={dept.id} sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{dept.name} ({dept.employees.length || 0} {t('employees', { ns: 'common', count: dept.employees.length || 0 })})</Typography>
                                    <List dense disablePadding sx={{ maxHeight: 150, overflow: 'auto' }}>
                                        {dept.employees.length === 0 ? (
                                            <ListItem><ListItemText primary={t('noEmployeesInDepartment', { ns: 'pages/managerDashboard' })} /></ListItem>
                                        ) : (
                                            dept.employees.map(emp => (
                                                <ListItem key={emp.id}>
                                                    <ListItemText primary={`${emp.first_name} ${emp.last_name}`} />
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
        </Grid>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BarChartIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2">
                        {t('poolHistoryChartTitle', { ns: 'pages/managerDashboard' })}
                    </Typography>
                </Box>
                <Button variant="contained" onClick={() => setIsFilterModalOpen(true)}>
                    {t('filter')}
                </Button>
            </Box>
            {filteredPools.length === 0 ? (
                <Typography variant="body1">{t('noPoolsYet', { ns: 'pages/managerDashboard' })}</Typography>
            ) : (
                <Box sx={{ height: 400, width: '100%' }}>
                    <Line options={chartOptions} data={chartData} />
                </Box>
            )}
        </Paper>

        <Dialog open={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t('filter')}</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
                <InputLabel>{t('year')}</InputLabel>
                <Select
                  value={selectedYear}
                  label={t('year')}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                <InputLabel>{t('month')}</InputLabel>
                <Select
                  value={selectedMonth}
                  label={t('month')}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsFilterModalOpen(false)}>{t('cancel')}</Button>
              <Button onClick={() => {
                setIsFilterModalOpen(false);
              }}>{t('apply')}</Button>
            </DialogActions>
          </Dialog>
    </Box>
  );
};

export default Overview;