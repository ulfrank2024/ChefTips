import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getCompanies } from '../api/companyApi';
import { getSubscriptions } from '../api/subscriptionApi';

const statusColors = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  suspended: 'error',
  inactive: 'error',
};

const RestaurantsPage = () => {
  const { t } = useTranslation('pages/restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companies, subscriptions] = await Promise.all([
          getCompanies(),
          getSubscriptions(),
        ]);

        const restaurantsData = companies.map((company) => {
          const subscription = subscriptions.find(
            (sub) => sub.company_id === company.id
          );
          return {
            ...company,
            subscriptionStatus: subscription ? subscription.status : 'na',
          };
        });

        setRestaurants(restaurantsData);
        setFilteredRestaurants(restaurantsData);
      } catch (err) {
        setError(err.message);
             } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    setFilteredRestaurants(
      restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [filter, restaurants]);

  const handleRowClick = (id) => {
    navigate(`/restaurants/${id}`);
  };

  return (
    <Box sx={{ py: 3, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          label={t('filter_by_name')}
          variant="outlined"
          fullWidth
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper} sx={{ boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('tableName')}</TableCell>
              <TableCell>{t('tableStatus')}</TableCell>
              <TableCell>{t('tableSubscriptionStatus')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>{t('loading')}</TableCell>
              </TableRow>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <TableRow
                  key={restaurant.id}
                  onClick={() => handleRowClick(restaurant.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>{restaurant.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={restaurant.is_active ? t('active') : t('inactive')}
                      color={restaurant.is_active ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(restaurant.subscriptionStatus.toLowerCase())}
                      color={statusColors[restaurant.subscriptionStatus.toLowerCase()] || 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RestaurantsPage;
