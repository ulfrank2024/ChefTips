import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Select, MenuItem, FormControl, InputLabel, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getDepartments, getCategories, createCategory, updateCategory, deleteCategory } from '../../api/tipApi';
import { useAlert } from '../../context/AlertContext';
import './ManageCategories.css';

const ManageCategories = () => {
  const { t } = useTranslation(['common', 'pages/managerDashboard', 'components/manager/manageCategories', 'errors']);
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isDualRole, setIsDualRole] = useState(false);

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesData, departmentsData] = await Promise.all([
        getCategories(),
        getDepartments()
      ]);
      setCategories(categoriesData);
      setDepartments(departmentsData);
    } catch (err) {
      setError(t(`errors.${err.message}`) || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    setCategoryName('');
    setDepartmentId('');
    setIsDualRole(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setCategoryName(category.name);
    setDepartmentId(category.department_id);
    setIsDualRole(category.is_dual_role || false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveCategory = async () => {
    if (!categoryName || !departmentId) {
      showAlert(t('error'), t('nameAndDepartmentRequired', { ns: 'components/manager/manageCategories' }));
      return;
    }

    const categoryData = { 
      name: categoryName, 
      department_id: departmentId, 
      is_dual_role: isDualRole 
    };

    try {
      if (isEditing) {
        await updateCategory(currentCategory.id, categoryData);
        showAlert(t('success'), t('categoryUpdated', { ns: 'components/manager/manageCategories' }));
      } else {
        await createCategory(categoryData);
        showAlert(t('success'), t('categoryCreated', { ns: 'components/manager/manageCategories' }));
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      setError(t(`errors.${err.message}`) || t('common.somethingWentWrong'));
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      showAlert(t('success'), t('categoryDeleted', { ns: 'components/manager/manageCategories' }));
      fetchData();
      setIsDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setError(t(`errors.${err.message}`) || t('common.somethingWentWrong'));
    }
  };

  const groupedCategories = departments.map(dept => ({
    ...dept,
    categories: categories.filter(cat => cat.department_id === dept.id)
  }));

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('manageCategories', { ns: 'pages/managerDashboard' })}
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenCreateModal}
        sx={{ mb: 3, backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
      >
        {t('createCategory', { ns: 'components/manager/manageCategories' })}
      </Button>

      {groupedCategories.map(dept => (
        <Paper key={dept.id} elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">{dept.name}</Typography>
          {dept.categories.length > 0 ? (
            <List>
              {dept.categories.map((category) => (
                <ListItem key={category.id} sx={{
                  backgroundColor: '#2a2a3e',
                  padding: 2,
                  borderRadius: '10px',
                  marginBottom: '10px',
                  border: '1px solid #1b2646ff',
                }}>
                  <ListItemText
                    primary={<Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{category.name}</Typography>}
                    secondary={<Typography sx={{ color: '#ccc' }}>{category.is_dual_role ? t('dualRole', { ns: 'components/manager/manageCategories' }) : ''}</Typography>}
                  />
                  <Box>
                    <IconButton edge="end" onClick={() => handleOpenEditModal(category)} sx={{ color: '#ad9407ff' }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteClick(category)} sx={{ color: '#dc3545' }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ mt: 2, backgroundColor: '#f0f0f0', color: '#333', padding: '16px', borderRadius: '4px' }}>{t('noCategoriesInDept', { ns: 'components/manager/manageCategories' })}</Typography>
          )}
        </Paper>
      ))}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>{isEditing ? t('editCategory', { ns: 'components/manager/manageCategories' }) : t('createCategory', { ns: 'components/manager/manageCategories' })}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('categoryNamePlaceholder', { ns: 'components/manager/manageCategories' })}
            type="text"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="department-select-label">{t('department', { ns: 'components/manager/manageCategories' })}</InputLabel>
            <Select
              labelId="department-select-label"
              value={departmentId}
              label={t('department', { ns: 'components/manager/manageCategories' })}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ backgroundColor: '#f0f0f0', padding: '16px', borderRadius: '4px', mt: 2, width: '100%' }}>
            <FormControlLabel
              control={<Checkbox checked={isDualRole} onChange={(e) => setIsDualRole(e.target.checked)} />}
              label={
                <Typography sx={{ color: '#333' }}>
                  {t('isDualRoleLabel', { ns: 'components/manager/manageCategories' })}
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleSaveCategory}>{t('save', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDeleteTitle', { ns: 'components/manager/manageCategories' })}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ backgroundColor: '#f0f0f0', color: '#333', padding: '16px', borderRadius: '4px' }}>
            {t('confirmDeleteMessage', { ns: 'components/manager/manageCategories', categoryName: categoryToDelete?.name })}
          </DialogContentText>
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

export default ManageCategories;

