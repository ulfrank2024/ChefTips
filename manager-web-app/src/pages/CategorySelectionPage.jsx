import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button,
  FormControl, InputLabel, Select, MenuItem, Container,
  Avatar, Stack
} from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/tipApi';
import dayjs from 'dayjs';

const CategorySelectionPage = () => {
  const { t } = useTranslation(['common', 'pages/serverDashboard']);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const fetchedCategories = await getCategories();
        const collectorCategories = fetchedCategories.filter(
          (cat) => cat.department_type === 'COLLECTOR'
        );
        setCategories(collectorCategories);
      } catch (err) {
        setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  const handleSelectCategory = () => {
    if (selectedCategoryId) {
      const today = dayjs().format('YYYY-MM-DD');
      localStorage.setItem('selectedCategory', JSON.stringify({
        categoryId: selectedCategoryId,
        date: today,
        userId: user.id
      }));
      navigate('/server/dashboard');
    } else {
      setError(t('SELECT_CATEGORY_REQUIRED', { ns: 'errors' }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper 
        elevation={8} 
        sx={{ 
          p: 4, 
          borderRadius: 4,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 60, height: 60 }}>
            <PlaylistAddCheckIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
            {t('selectYourCategory', { ns: 'pages/serverDashboard' })}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('selectYourRoleForTheDayHelpText', { ns: 'pages/serverDashboard', defaultValue: 'Choose your role to start your shift and record your tips.' })}
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          <FormControl fullWidth margin="normal" required variant="outlined">
            <InputLabel id="category-select-label">{t('category', { ns: 'common' })}</InputLabel>
            <Select
              labelId="category-select-label"
              value={selectedCategoryId}
              label={t('category', { ns: 'common' })}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              size="large"
              sx={{ py: 1.5 }}
              onClick={logout}
            >
              {t('logout', { ns: 'common' })}
            </Button>
            <Button
              type="button"
              fullWidth
              variant="contained"
              size="small"
              sx={{ py: 1.5, fontWeight: 'bold' }}
              onClick={handleSelectCategory}
              disabled={!selectedCategoryId}
            >
              {t('confirmSelection', { ns: 'pages/serverDashboard' })}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default CategorySelectionPage;
