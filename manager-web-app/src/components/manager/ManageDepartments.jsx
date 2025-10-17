import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getCategories } from '../../api/tipApi';
import { useAlert } from '../../context/AlertContext';

const ManageDepartments = () => {
  const { t } = useTranslation(['common', 'errors', 'components/manager/manageDepartments']);
  const { showAlert } = useAlert();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentType, setDepartmentType] = useState('');
  const [distribution, setDistribution] = useState({});

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [departmentsData, categoriesData] = await Promise.all([
        getDepartments(),
        getCategories()
      ]);
      setDepartments(departmentsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentDepartment(null);
    setDepartmentName('');
    setDepartmentType('');
    setDistribution({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (department) => {
    setIsEditing(true);
    setCurrentDepartment(department);
    setDepartmentName(department.name);
    setDepartmentType(department.department_type || '');
    setDistribution(department.category_distribution || {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDistributionChange = (categoryId, value) => {
    const newDistribution = { ...distribution, [categoryId]: Number(value) };
    setDistribution(newDistribution);
  };

  const handleSaveDepartment = async () => {
    if (!departmentName || !departmentType) {
      showAlert(t('error'), t('nameAndTypeRequired', { ns: 'components/manager/manageDepartments' }));
      return;
    }

    const categoriesInDept = isEditing ? categories.filter(c => c.department_id === currentDepartment.id) : [];

    if (departmentType === 'RECEIVER' && categoriesInDept.length > 0) {
      const total = Object.values(distribution).reduce((sum, percent) => sum + percent, 0);
      if (total !== 100) {
        showAlert(t('error'), t('distributionMustEqual100', { ns: 'components/manager/manageDepartments' }));
        return;
      }
    }

    const departmentData = { 
      name: departmentName, 
      department_type: departmentType,
      distribution: departmentType === 'RECEIVER' ? distribution : {}
    };

    try {
      if (isEditing) {
        await updateDepartment(currentDepartment.id, departmentData);
        showAlert(t('success'), t('departmentUpdated', { ns: 'components/manager/manageDepartments' }));
      } else {
        await createDepartment(departmentData);
        showAlert(t('success'), t('departmentCreated', { ns: 'components/manager/manageDepartments' }));
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
  };

  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;
    try {
      await deleteDepartment(departmentToDelete.id);
      showAlert(t('success'), t('departmentDeleted', { ns: 'components/manager/manageDepartments' }));
      fetchData();
      setIsDeleteConfirmOpen(false);
      setDepartmentToDelete(null);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
  };

  const totalDistribution = Object.values(distribution).reduce((sum, percent) => sum + percent, 0);

  const categoriesInCurrentDepartment = isEditing && currentDepartment 
    ? categories.filter(c => c.department_id === currentDepartment.id) 
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('manageDepartments', { ns: 'pages/managerDashboard' })}
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenCreateModal}
        sx={{ mb: 3, backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
      >
        {t('createDepartment', { ns: 'components/manager/manageDepartments' })}
      </Button>

      <Paper elevation={3} sx={{ p: 3 }}>
        {departments.length > 0 ? (
          <List>
            {departments.map((department) => (
              <ListItem key={department.id} sx={{
                backgroundColor: '#2a2a3e',
                padding: 2,
                borderRadius: '10px',
                marginBottom: '10px',
                border: '1px solid #1b2646ff',
              }}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => handleOpenEditModal(department)} sx={{ color: '#ad9407ff' }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteClick(department)} sx={{ color: '#dc3545' }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{department.name}</Typography>}
                  secondary={<Typography sx={{ color: '#ccc' }}>{t(department.department_type, { ns: 'components/manager/manageDepartments' })}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ backgroundColor: '#333333', color: 'white', p: 1, borderRadius: 1 }}>{t('noDepartments', { ns: 'components/manager/manageDepartments' })}</Typography>
        )}
      </Paper>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? t('editDepartment', { ns: 'components/manager/manageDepartments' }) : t('createDepartment', { ns: 'components/manager/manageDepartments' })}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('departmentNamePlaceholder', { ns: 'components/manager/manageDepartments' })}
            type="text"
            fullWidth
            variant="outlined"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="department-type-select-label">{t('departmentType', { ns: 'components/manager/manageDepartments' })}</InputLabel>
            <Select
              labelId="department-type-select-label"
              value={departmentType}
              label={t('departmentType', { ns: 'components/manager/manageDepartments' })}
              onChange={(e) => setDepartmentType(e.target.value)}
            >
              <MenuItem value="COLLECTOR">{t('collector', { ns: 'components/manager/manageDepartments' })}</MenuItem>
              <MenuItem value="RECEIVER">{t('receiver', { ns: 'components/manager/manageDepartments' })}</MenuItem>
            </Select>
          </FormControl>

          {isEditing && departmentType === 'RECEIVER' && (
            <Box mt={2}>
              <Typography variant="h6">{t('distributionTitle', { ns: 'components/manager/manageDepartments' })}</Typography>
              {categoriesInCurrentDepartment.map(cat => (
                <Grid container spacing={2} key={cat.id} alignItems="center">
                  <Grid item xs={6}>
                    <Typography>{cat.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      type="number"
                      label={t('percentage', { ns: 'components/manager/manageDepartments' })}
                      value={distribution[cat.id] || ''}
                      onChange={(e) => handleDistributionChange(cat.id, e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ))}
              <Typography color={totalDistribution !== 100 ? 'error' : 'success'} sx={{ mt: 1 }}>
                Total: {totalDistribution}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleSaveDepartment}>{t('save', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDeleteTitle', { ns: 'components/manager/manageDepartments' })}</DialogTitle>
        <DialogContent>
          <Typography sx={{ backgroundColor: '#f0f0f0', color: '#333', padding: '16px', borderRadius: '4px' }}>
            {t('confirmDeleteMessage', { ns: 'components/manager/manageDepartments', departmentName: departmentToDelete?.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            {t('delete', { ns: 'common' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDepartments;