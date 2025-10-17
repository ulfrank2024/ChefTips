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
import { getTipsByCollector, submitDailyReport, getCategories } from '../../api/tipApi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import DeclareTipModal from './DeclareTipModal';

const ServerOverview = () => {
  const { t } = useTranslation(['pages/serverDashboard', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collectedTips, setCollectedTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState({ id: null, name: '', date: '' });

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
          const allCategories = await getCategories();
          const foundCategory = allCategories.find(cat => cat.id === parsedData.categoryId);
          setSelectedCategoryInfo({ 
            id: foundCategory ? foundCategory.id : null,
            name: foundCategory ? foundCategory.name : 'N/A',
            date: parsedData.date // Keep original date format for the API
          });
        }

        // Fetch tips
        const now = dayjs();
        const startDate = now.startOf('month').toISOString();
        const endDate = now.endOf('month').toISOString();
        const tips = await getTipsByCollector(user.id, startDate, endDate);
        setCollectedTips(tips);

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
    const tips = await getTipsByCollector(user.id, startDate, endDate);
    setCollectedTips(tips);
    setLoading(false);
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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setIsModalOpen(true)}>
          {t('declareNewTip', { ns: 'pages/serverDashboard' })}
        </Button>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('recentTips', { ns: 'pages/serverDashboard' })}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('serviceDate', { ns: 'pages/serverDashboard' })}</TableCell>
                    <TableCell>{t('category', { ns: 'common' })}</TableCell>
                    <TableCell>{t('totalSales', { ns: 'common' })}</TableCell>
                    <TableCell>{t('grossTips', { ns: 'common' })}</TableCell>
                    <TableCell>{t('netTips', { ns: 'pages/serverDashboard' })}</TableCell>
                    <TableCell>{t('manualAdjustment', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collectedTips.length > 0 ? (
                    collectedTips.map((tip) => (
                      <TableRow key={tip.id}>
                        <TableCell>{dayjs(tip.service_date).format('YYYY-MM-DD')}</TableCell>
                        <TableCell>{tip.category_name}</TableCell>
                        <TableCell>{parseFloat(tip.total_sales).toFixed(2)} $</TableCell>
                        <TableCell>{parseFloat(tip.gross_tips).toFixed(2)} $</TableCell>
                        <TableCell>{parseFloat(tip.net_tips).toFixed(2)} $</TableCell>
                        <TableCell>
                          {(() => {
                            const manualAdjustments = (tip.adjustments || []).filter(
                              (adj) => adj.adjustment_type === 'MANUAL'
                            );
                            const totalManualAdjustment = manualAdjustments.reduce(
                              (sum, adj) => sum + parseFloat(adj.amount), 
                              0
                            );
                            return totalManualAdjustment.toFixed(2) + ' $';
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {t('noTipsFound', { ns: 'pages/serverDashboard' })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <DeclareTipModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitReport={submitDailyReport}
        categoryId={selectedCategoryInfo.id} // Pass the ID
        serviceDate={selectedCategoryInfo.date} // Pass the date
      />
    </Box>
  );
};

export default ServerOverview;