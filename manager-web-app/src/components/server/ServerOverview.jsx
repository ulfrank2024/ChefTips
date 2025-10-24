import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, CircularProgress, Alert, Grid, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Chip
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCashOutsByCollector, submitCashOutReport, getCompanyEmployees } from '../../api/tipApi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import DeclareTipModal from './DeclareTipModal';

const ServerOverview = () => {
  const { t } = useTranslation(['pages/serverDashboard', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState({ id: null, name: '', date: '' });
  const [canDeclare, setCanDeclare] = useState(false);
  const [latestCashOut, setLatestCashOut] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        if (!user || !user.id) {
          setError(t('userIdNotFound', { ns: 'pages/serverDashboard' }));
          return;
        }

        // Get selected category from localStorage
        const storedCategoryData = localStorage.getItem('selectedCategory');
        if (storedCategoryData) {
          const parsedData = JSON.parse(storedCategoryData);
          setSelectedCategoryInfo({ 
            id: parsedData.id,
            name: parsedData.name,
            date: parsedData.date
          });
          setCanDeclare(parsedData.is_contributor || false);
        }

        // Fetch tips
        const now = dayjs();
        const startDate = now.startOf('month').toISOString();
        const endDate = now.endOf('month').toISOString();
        const tips = await getCashOutsByCollector(user.id, startDate, endDate);
        if (tips.length > 0) {
          setLatestCashOut(tips[0]); // Le premier élément est le plus récent
        } else {
          setLatestCashOut(null);
        }

        // Fetch employees
        const employeesData = await getCompanyEmployees();
        setEmployees(employeesData);

      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, t]);

  const onDeclareSuccess = async () => {
    setIsModalOpen(false);
    // Re-fetch tips to update the list
    setLoading(true);
    const now = dayjs();
    const startDate = now.startOf('month').toISOString();
    const endDate = now.endOf('month').toISOString();
    const tips = await getCashOutsByCollector(user.id, startDate, endDate);
    if (tips.length > 0) {
      setLatestCashOut(tips[0]); // Mettre à jour le dernier Cash Out
    } else {
      setLatestCashOut(null);
    }
    setLoading(false);
  };

  const handleCashOutSubmit = async (reportData) => {
    try {
      await submitCashOutReport(reportData);
      onDeclareSuccess();
    } catch (err) {
      throw err; // Re-throw the error so DeclareTipModal can catch it
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={4} sx={{ p: 3, mb: 4, borderRadius: 3, background: '#f3f4f6' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {t('welcome', { ns: 'common' })}, {user?.first_name || 'Server'}!
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/server/select-category')}>
            {t('changeCategory', { ns: 'pages/serverDashboard', defaultValue: 'Change Role' })}
          </Button>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Chip icon={<BusinessIcon />} label={`${t('company', { ns: 'common', defaultValue: 'Company' })}: ${user?.company_name || 'N/A'}`} />
          <Chip icon={<CategoryIcon />} label={`${t('category', { ns: 'common' })}: ${selectedCategoryInfo.name}`} />
          <Chip icon={<EventIcon />} label={`${t('date', { ns: 'common' })}: ${selectedCategoryInfo.date}`} />
        </Stack>
      </Paper>

      {canDeclare && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Button variant="contained" color="primary" onClick={() => setIsModalOpen(true)}>
            {t('declareCashOut', { ns: 'pages/serverDashboard' })}
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {latestCashOut ? (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('latestCashOut', { ns: 'pages/serverDashboard' })}
              </Typography>
              <Box>
                <Typography variant="body1">
                  <strong>{t('serviceDate', { ns: 'pages/serverDashboard' })}:</strong> {dayjs(latestCashOut.service_date).format('YYYY-MM-DD')}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('category', { ns: 'common' })}:</strong> {latestCashOut.category_name}
                </Typography>


                <Typography variant="body1">
                  <strong>{t('grossTips', { ns: 'common' })}:</strong> {parseFloat(latestCashOut.gross_tips).toFixed(2)} $
                </Typography>
                <Typography variant="body1">
                  <strong>{t('netTips', { ns: 'pages/serverDashboard' })}:</strong> {parseFloat(latestCashOut.net_tips).toFixed(2)} $
                </Typography>
                <Typography variant="body1">
                  <strong>{t('cashAdjustment', { ns: 'pages/serverDashboard' })}:</strong> {parseFloat(latestCashOut.cash_difference).toFixed(2)} $
                </Typography>
                <Typography variant="body1">
                  <strong>{t('tipOuts', { ns: 'pages/serverDashboard' })}:</strong>
                  {(() => {
                    const tipOutAdjustments = (latestCashOut.adjustments || []).filter(
                      (adj) => adj.adjustment_type === 'TIP_OUT_AUTOMATIC'
                    );
                    if (tipOutAdjustments.length === 0) {
                      return 'N/A';
                    }
                    return (
                      <Box>
                        {tipOutAdjustments.map((adj, index) => {
                          const recipient = employees.find(emp => emp.id === adj.related_user_id);
                          const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : '';
                          return (
                            <Typography key={index} variant="body2">
                              {adj.description}: {parseFloat(adj.amount).toFixed(2)} $ {recipientName ? `(${recipientName})` : ''}
                            </Typography>
                          );
                        })}
                      </Box>
                    );
                  })()}
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="body1" align="center">
                {t('noCashOutsFound', { ns: 'pages/serverDashboard' })}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <DeclareTipModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitCashOutReport={handleCashOutSubmit}
        onDeclareSuccess={onDeclareSuccess}
      />
    </Box>
  );
};

export default ServerOverview;