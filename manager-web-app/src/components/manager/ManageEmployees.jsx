import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getCompanyEmployees, inviteEmployee, removeEmployee, updateEmployeeMembership } from '../../api/authApi';
import { getDepartments, getCategories } from '../../api/tipApi';
import { useAlert } from '../../context/AlertContext';
import { useNavigate } from 'react-router-dom';
import './ManageEmployees.css';

const ManageEmployees = () => {
  const { t } = useTranslation(['common', 'errors', 'components/manager/manageEmployees']);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email) {
      return t('EMAIL_REQUIRED', { ns: 'errors' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return t('INVALID_EMAIL_FORMAT', { ns: 'errors' });
    }
    return '';
  };

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState('');

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesData, departmentsData, categoriesData] = await Promise.all([
        getCompanyEmployees(),
        getDepartments(),
        getCategories()
      ]);
      setEmployees(employeesData);
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

  const filteredEmployees = employees.filter(employee => {
    const nameMatch = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const category = categories.find(c => c.id === employee.category_id);
    const department = category ? departments.find(d => d.id === category.department_id) : departments.find(d => d.department_type === 'COLLECTOR');
    
    const departmentMatch = filterDepartment === 'all' || (department && department.id === filterDepartment);

    return (nameMatch || emailMatch) && departmentMatch;
  });

  const handleOpenInviteModal = () => {
    resetModalState();
    setIsInviteModalOpen(true);
  };

  const handleOpenEditModal = (employee) => {
    resetModalState();
    setCurrentEmployee(employee);
    const category = categories.find(c => c.id === employee.category_id);
    const department = category ? departments.find(d => d.id === category.department_id) : null;
    setSelectedDepartment(department?.id || '');
    setSelectedCategory(category?.id || '');
    setIsEditModalOpen(true);
  };

  const resetModalState = () => {
    setInviteEmail('');
    setSelectedDepartment('');
    setSelectedCategory('');
    setCurrentEmployee(null);
    setModalLoading(false);
    setModalError('');
    setInviteEmailError('');
  };

  const handleInviteSubmit = async () => {
    if (!inviteEmail || !selectedDepartment) {
      setModalError(t('emailAndDepartmentRequired', { ns: 'components/manager/manageEmployees' }));
      return;
    }
    const receiverDept = departments.find(d => d.department_type === 'RECEIVER');
    if (selectedDepartment === receiverDept?.id && !selectedCategory) {
      setModalError(t('categoryRequiredForReceiver', { ns: 'components/manager/manageEmployees' }));
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      await inviteEmployee(inviteEmail, selectedCategory || null);
      showAlert(t('success'), t('employeeInvitedSuccessfully', { ns: 'components/manager/manageEmployees' }));
      setIsInviteModalOpen(false);
      resetModalState();
      fetchData(); // Refresh list
    } catch (err) {
      setModalError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDepartment) {
      setModalError(t('departmentRequired', { ns: 'components/manager/manageEmployees' }));
      return;
    }
    const receiverDept = departments.find(d => d.department_type === 'RECEIVER');
    if (selectedDepartment === receiverDept?.id && !selectedCategory) {
      setModalError(t('categoryRequiredForReceiver', { ns: 'components/manager/manageEmployees' }));
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      await updateEmployeeMembership(currentEmployee.membership_id, selectedCategory || null);
      showAlert(t('success'), t('employeeUpdatedSuccessfully', { ns: 'components/manager/manageEmployees' }));
      setIsEditModalOpen(false);
      resetModalState();
      fetchData(); // Refresh list
    } catch (err) {
      setModalError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    try {
      await removeEmployee(employeeToDelete.membership_id);
      showAlert(t('success'), t('employeeDeleted', { ns: 'components/manager/manageEmployees' }));
      setIsDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      fetchData(); // Refresh list
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
  };

  const receiverDepartment = departments.find(d => d.department_type === 'RECEIVER');
  const categoriesForReceiver = receiverDepartment ? categories.filter(c => c.department_id === receiverDepartment.id) : [];

  const getEmployeeInfo = (employee) => {
    const category = categories.find(c => c.id === employee.category_id);
    const department = category ? departments.find(d => d.id === category.department_id) : departments.find(d => d.department_type === 'COLLECTOR');
    
    if (!category) {
      return department ? department.name : t('frontOfHouse', { ns: 'components/manager/manageEmployees' });
    }
    
    return `${department?.name || ''} - ${category.name}`;
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        {t('manageEmployees', { ns: 'pages/managerDashboard' })} ({employees.length})
      </Typography>

      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenInviteModal}
            sx={{ mb: 2, backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}
          >
            {t('inviteEmployee', { ns: 'components/manager/manageEmployees' })}
          </Button>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                label={t('searchPlaceholder', { ns: 'components/manager/manageEmployees' })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="filter-department-label">{t('department', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                <Select
                  labelId="filter-department-label"
                  value={filterDepartment}
                  label={t('department', { ns: 'components/manager/manageEmployees' })}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <MenuItem value="all">{t('all', { ns: 'common' })}</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <List>
              {filteredEmployees.map((employee) => {
                const employeeCategory = categories.find(c => c.id === employee.category_id);
                const employeeDepartment = employeeCategory ? departments.find(d => d.id === employeeCategory.department_id) : null;
                const isReceiver = employeeDepartment?.department_type === 'RECEIVER';

                return (
                  <ListItem
                    key={employee.id}
                    sx={{
                      backgroundColor: '#2a2a3e',
                      padding: 2,
                      borderRadius: '10px',
                      mb: 1,
                      cursor: isReceiver ? 'pointer' : 'default', // Change cursor for clickable items
                    }}
                    onClick={isReceiver ? () => navigate(`/dashboard/employee-details/${employee.id}`) : null}
                    secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditModal(employee)} sx={{ color: '#ad9407ff', mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(employee)} sx={{ color: '#dc3545' }}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff' }}>{`${employee.first_name || ''} ${employee.last_name || ''} (${employee.email})`}</Typography>}
                      secondary={<Typography sx={{ color: '#ccc' }}>{getEmployeeInfo(employee)}</Typography>}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </>
      )}

      {/* Invite Employee Dialog */}
      <Dialog open={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('inviteEmployee', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
        <DialogContent>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
          <DialogContentText sx={{ mb: 2 }}>
            {t('inviteInstructions', { ns: 'components/manager/manageEmployees' })}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('employeeEmailPlaceholder', { ns: 'components/manager/manageEmployees' })}
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value);
              setInviteEmailError(validateEmail(e.target.value));
            }}
            error={!!inviteEmailError}
            helperText={inviteEmailError}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="department-select-label">{t('department', { ns: 'components/manager/manageEmployees' })}</InputLabel>
            <Select
              labelId="department-select-label"
              value={selectedDepartment}
              label={t('department', { ns: 'components/manager/manageEmployees' })}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedDepartment === receiverDepartment?.id && (
            <FormControl fullWidth>
              <InputLabel id="category-select-label">{t('category', { ns: 'components/manager/manageEmployees' })}</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                label={t('category', { ns: 'components/manager/manageEmployees' })}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoriesForReceiver.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInviteModalOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleInviteSubmit} disabled={modalLoading || !!inviteEmailError}>
            {modalLoading ? <CircularProgress size={24} /> : t('sendInvitation', { ns: 'components/manager/manageEmployees' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('editEmployee', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
        <DialogContent>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
          <Typography variant="h6">{`${currentEmployee?.first_name || ''} ${currentEmployee?.last_name || ''}`}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{currentEmployee?.email}</Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="edit-department-select-label">{t('department', { ns: 'components/manager/manageEmployees' })}</InputLabel>
            <Select
              labelId="edit-department-select-label"
              value={selectedDepartment}
              label={t('department', { ns: 'components/manager/manageEmployees' })}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedCategory(''); // Reset category when department changes
              }}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedDepartment === receiverDepartment?.id && (
            <FormControl fullWidth>
              <InputLabel id="edit-category-select-label">{t('category', { ns: 'components/manager/manageEmployees' })}</InputLabel>
              <Select
                labelId="edit-category-select-label"
                value={selectedCategory}
                label={t('category', { ns: 'components/manager/manageEmployees' })}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoriesForReceiver.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditModalOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleEditSubmit} disabled={modalLoading}>
            {modalLoading ? <CircularProgress size={24} /> : t('save', { ns: 'common' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Employee Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDeleteTitle', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirmDeleteMessage', { ns: 'components/manager/manageEmployees', employeeName: `${employeeToDelete?.first_name || ''} ${employeeToDelete?.last_name || ''}` })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleDeleteConfirm} color="error">{t('delete', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageEmployees;
