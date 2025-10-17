import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import dayjs from 'dayjs';
import { getCompanyEmployees } from '../api/authApi'; // To get employee details
import { getEmployeeReceivedTips } from '../api/tipApi'; // To get received tips
import { useAuth } from '../context/AuthContext';

const EmployeeDetailsPage = () => {
  const { employeeId } = useParams();
  const { t } = useTranslation(['common', 'pages/employeeDetails']);
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [receivedTips, setReceivedTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        // Fetch all company employees and find the specific one
        const allEmployees = await getCompanyEmployees();
        const currentEmployee = allEmployees.find(emp => emp.id === employeeId);

        if (!currentEmployee) {
          setError(t('employeeNotFound', { ns: 'pages/employeeDetails' }));
          setLoading(false);
          return;
        }
        setEmployee(currentEmployee);

        // Fetch received tips for this employee
        const tips = await getEmployeeReceivedTips(employeeId);
        setReceivedTips(tips);

      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId, t, user?.company_id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return <Alert severity="info">{t('noEmployeeData', { ns: 'pages/employeeDetails' })}</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {t('employeeDetailsTitle', { ns: 'pages/employeeDetails' })}: 
        <Box component="span" sx={{ backgroundColor: '#ad9407ff', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
          {employee.first_name} {employee.last_name}
        </Box>
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{employee.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccessTimeIcon sx={{ mr: 1 }} />
          <Typography variant="body1" sx={{ color: 'black' }}>
            {t('joinedCompany', { ns: 'pages/employeeDetails' })}: {dayjs(employee.created_at).format('YYYY-MM-DD HH:mm')}
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {t('receivedTipsHistory', { ns: 'pages/employeeDetails' })}
      </Typography>

      {receivedTips.length === 0 ? (
        <Alert severity="info">{t('noReceivedTips', { ns: 'pages/employeeDetails' })}</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('date', { ns: 'common' })}</TableCell>
                <TableCell>{t('department', { ns: 'pages/employeeDetails' })}</TableCell>
                <TableCell align="right">{t('amount', { ns: 'common' })}</TableCell>
                <TableCell align="right">{t('hoursWorked', { ns: 'pages/employeeDetails' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivedTips.map((tip, index) => (
                <TableRow key={index}>
                  <TableCell>{dayjs(tip.start_date).format('YYYY-MM-DD')} - {dayjs(tip.end_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{tip.department_name}</TableCell>
                  <TableCell align="right">{Number(tip.distributed_amount).toFixed(2)} $</TableCell>
                  <TableCell align="right">{Number(tip.hours_worked).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EmployeeDetailsPage;