import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText, TextField } from '@mui/material';
import { getEmployeesTotalTips } from '../../api/tipApi';
import { getCompanyEmployees } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext.jsx';
import './EmployeeTotalTips.css';

const EmployeeTotalTips = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError('');

      if (isLoading || !user || !user.company_id) {
        if (!isLoading && (!user || !user.company_id)) {
          setError(t('createPool.companyIdNotFound')); // Or a more appropriate message
        }
        setLoading(false);
        return;
      }

      try {
        const [companyEmployees, employeesTotalTips] = await Promise.all([
          getCompanyEmployees(user.company_id),
          getEmployeesTotalTips()
        ]);

        const mergedEmployees = companyEmployees.map(companyEmp => {
          const totalTipsData = employeesTotalTips.find(tipEmp => tipEmp.id === companyEmp.id);
          return {
            ...companyEmp,
            totalTips: totalTipsData ? totalTipsData.totalTips : 0,
          };
        });

        setEmployees(mergedEmployees);
      } catch (err) {
        setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [t, user, isLoading]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
      // Exclude servers from this list
      return employee.role !== 'server' && fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [employees, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
      <Box className="employee-total-tips-container">
          <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
              {t("dashboard.menu.employeeTips")} ({employees.length})
          </Typography>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <TextField
                  fullWidth
                  label={t("employeeTotalTips.searchPlaceholder")}
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />

              {filteredEmployees && filteredEmployees.length > 0 ? (
                  <List>
                      {filteredEmployees.map((employee) => (
                          <ListItem key={employee.id}>
                              <ListItemText
                                  primary={
                                      <Typography variant="h6">
                                          {employee.first_name} {employee.last_name}
                                      </Typography>
                                  }
                                  secondary={
                                      <Typography
                                          component="span"
                                          variant="body2"
                                      >
                                          <strong>
                                              {t(
                                                  "employeeTotalTips.totalReceived"
                                              )}
                                              :
                                          </strong>{" "}
                                          {parseFloat(
                                              employee.totalTips
                                          ).toFixed(2)}{" "}
                                          $
                                      </Typography>
                                  }
                              />
                          </ListItem>
                      ))}
                  </List>
              ) : (
                  <Typography variant="body2" sx={{ backgroundColor: '#333333', color: 'white', p: 1, borderRadius: 1 }}>
    {t("employeeTotalTips.noEmployeesFound")}
</Typography>
              )}
          </Paper>
      </Box>
  );
};

export default EmployeeTotalTips;
