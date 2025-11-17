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
} from '@mui/material';
import { getCompanies } from '../api/companyApi';
import { getSubscriptions } from '../api/subscriptionApi';

const RestaurantsPage = () => {
  const { t } = useTranslation('pages/restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            subscriptionStatus: subscription ? subscription.status : 'N/A',
          };
        });

        setRestaurants(restaurantsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Subscription Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>Loading...</TableCell>
              </TableRow>
            ) : (
              restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>{restaurant.name}</TableCell>
                  <TableCell>{restaurant.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>{restaurant.subscriptionStatus}</TableCell>
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
