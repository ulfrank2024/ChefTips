import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getCompanyEmployees, inviteEmployee, removeEmployee, updateEmployeeMembership, getCompanyCategories } from '../../api/authApi';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import './ManageEmployees.css';
import { useTheme, useMediaQuery } from '@mui/material';

const ManageEmployees = () => {
  const { t } = useTranslation(['common', 'errors', 'components/manager/manageEmployees']);
  const { showAlert } = useAlert();
  const { handleTokenUpdate } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validateEmail = (email) => {
    if (!email) {
      return t('EMAIL_REQUIRED', { ns: 'errors' });
    }
    if (!/\S+@\S+\.\S/.test(email)) {
      return t('INVALID_EMAIL_FORMAT', { ns: 'errors' });
    }
    return '';
  };

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [permissionCashOut, setPermissionCashOut] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCanCashOut, setInviteCanCashOut] = useState(false);
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState('');

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesData, categoriesData] = await Promise.all([
        getCompanyEmployees(),
        getCompanyCategories()
      ]);
      setEmployees(employeesData);
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
    
    let categoryMatch = true;
    if (filterCategory !== 'all') {
      categoryMatch = employee.category_id === filterCategory;
    }

    return (nameMatch || emailMatch) && categoryMatch;
  });

  const handleOpenInviteModal = () => {
    resetModalState();
    setIsInviteModalOpen(true);
  };

  const handleOpenEditModal = (employee) => {
    resetModalState();
    setCurrentEmployee(employee);
    setSelectedCategoryId(employee.category_id || '');
    setPermissionCashOut(employee.can_cash_out);
    setIsEditModalOpen(true);
  };

  const resetModalState = () => {
    setInviteEmail('');
    setInviteCanCashOut(false);
    setCurrentEmployee(null);
    setSelectedCategoryId('');
    setPermissionCashOut(false);
    setModalLoading(false);
    setModalError('');
    setInviteEmailError('');
  };

  const handleInviteSubmit = async () => {
    const emailError = validateEmail(inviteEmail);
    if (emailError) {
      setInviteEmailError(emailError);
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      await inviteEmployee(inviteEmail, inviteCanCashOut);
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
    if (!currentEmployee) return;
    setModalLoading(true);
    setModalError('');
    try {
      const data = await updateEmployeeMembership(currentEmployee.membership_id, { categoryId: selectedCategoryId, can_cash_out: permissionCashOut });
      if (data.token) {
        handleTokenUpdate(data.token);
      }
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

  const getEmployeeCategoryName = (employee) => {
    return employee.category_name || t('noCategory', { ns: 'components/manager/manageEmployees' });
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
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <TextField
                fullWidth
                variant="outlined"
                label={t('searchPlaceholder', { ns: 'components/manager/manageEmployees' })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: isMobile ? 2 : 0 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="filter-category-label">{t('category', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                <Select
                  labelId="filter-category-label"
                  value={filterCategory}
                  label={t('category', { ns: 'components/manager/manageEmployees' })}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">{t('all', { ns: 'common' })}</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <List>
              {filteredEmployees.map((employee) => (
                  <ListItem
                    key={employee.id}
                    sx={{
                      backgroundColor: '#2a2a3e',
                      padding: 2,
                      borderRadius: '10px',
                      mb: 1,
                      flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
                      alignItems: isMobile ? 'flex-start' : 'center', // Align items to start on mobile
                    }}
                    secondaryAction={
                      isMobile ? null : ( // Hide secondaryAction on mobile, render actions inside ListItemText
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip
                            label={employee.can_cash_out ? t('canCashOut', { ns: 'components/manager/manageEmployees' }) : t('cannotCashOut', { ns: 'components/manager/manageEmployees' })}
                            color={employee.can_cash_out ? 'success' : 'default'}
                            size="small"
                            sx={{ mr: 2, color: employee.can_cash_out ? '#fff' : '#000', backgroundColor: employee.can_cash_out ? '#28a745' : '#6c757d' }}
                          />
                          <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditModal(employee)} sx={{ color: '#ad9407ff' }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(employee)} sx={{ color: '#dc3545' }}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff' }}>{`${employee.first_name || ''} ${employee.last_name || ''} (${employee.email})`}</Typography>}
                      secondary={
                        <Box component="span">
                          <Typography component="span" sx={{ color: '#ccc', display: 'block' }}>{getEmployeeCategoryName(employee)}</Typography>
                          {isMobile && ( // Render actions below text on mobile
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={employee.can_cash_out ? t('canCashOut', { ns: 'components/manager/manageEmployees' }) : t('cannotCashOut', { ns: 'components/manager/manageEmployees' })}
                                color={employee.can_cash_out ? 'success' : 'default'}
                                size="small"
                                sx={{ mr: 2, color: employee.can_cash_out ? '#fff' : '#000', backgroundColor: employee.can_cash_out ? '#28a745' : '#6c757d' }}
                              />
                              <IconButton aria-label="edit" onClick={() => handleOpenEditModal(employee)} sx={{ color: '#ad9407ff' }}>
                                <EditIcon />
                              </IconButton>
                              <IconButton aria-label="delete" onClick={() => handleDeleteClick(employee)} sx={{ color: '#dc3545' }}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
              ))}
            </List>
          </Paper>

          {/* Invite Employee Modal */}
          <Dialog open={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)}>
            <DialogTitle>{t('inviteEmployee', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {t('inviteEmployeeDescription', { ns: 'components/manager/manageEmployees' })}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="email"
                label={t('emailAddress', { ns: 'common' })}
                type="email"
                fullWidth
                variant="standard"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteEmailError(validateEmail(e.target.value));
                }}
                error={!!inviteEmailError}
                helperText={inviteEmailError}
              />
              <FormControlLabel
                control={<Switch checked={inviteCanCashOut} onChange={(e) => setInviteCanCashOut(e.target.checked)} />}
                label={t('canCashOutPermission', { ns: 'components/manager/manageEmployees' })}
              />
              {modalError && <Alert severity="error" sx={{ mt: 2 }}>{modalError}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsInviteModalOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
              <Button onClick={handleInviteSubmit} disabled={modalLoading}>
                {modalLoading ? <CircularProgress size={24} /> : t('invite', { ns: 'components/manager/manageEmployees' })}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Employee Modal */}
          <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <DialogTitle>{t('editEmployee', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {t('editEmployeeDescription', { ns: 'components/manager/manageEmployees' })}
              </DialogContentText>
              <FormControl fullWidth margin="dense">
                  <InputLabel id="edit-category-label">{t('category', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                  <Select
                    labelId="edit-category-label"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    label={t('category', { ns: 'components/manager/manageEmployees' })}
                  >
                    <MenuItem value=""><em>{t('none', { ns: 'common' })}</em></MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              <FormControlLabel
                control={<Switch checked={permissionCashOut} onChange={(e) => setPermissionCashOut(e.target.checked)} />}
                label={
                  <Typography style={{ color: 'black' }}>
                    {t('canCashOutPermission', { ns: 'components/manager/manageEmployees' })}
                  </Typography>
                }
              />
              {modalError && <Alert severity="error" sx={{ mt: 2 }}>{modalError}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEditModalOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
              <Button onClick={handleEditSubmit} disabled={modalLoading}>
                {modalLoading ? <CircularProgress size={24} /> : t('save', { ns: 'common' })}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
          >
            <DialogTitle>{t('confirmDeletion', { ns: 'components/manager/manageEmployees' })}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {t('areYouSureYouWantToDelete', { ns: 'components/manager/manageEmployees' })} {employeeToDelete?.first_name} {employeeToDelete?.last_name}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDeleteConfirmOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
              <Button onClick={handleDeleteConfirm} color="error">
                {t('delete', { ns: 'common' })}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ManageEmployees;