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
import { getCompanyEmployees, inviteEmployee, removeEmployee, updateEmployeeMembership } from '../../api/authApi';
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
    if (!/\S+@\S+\.\S/.test(email)) {
      return t('INVALID_EMAIL_FORMAT', { ns: 'errors' });
    }
    return '';
  };

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // New state for role filter

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [permissionCashOut, setPermissionCashOut] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviteKey, setSelectedInviteKey] = useState(''); // Combines role and permission
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState('');

  const predefinedRoles = ['CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'];
  const inviteRoles = [
    { key: 'CUISINIER', role: 'CUISINIER', can_cash_out: false, labelKey: 'cuisinier' },
    { key: 'SUPPORT_DE_SALLE', role: 'SERVEUR', can_cash_out: false, labelKey: 'supportDeSalle' },
  ];

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const employeesData = await getCompanyEmployees();
      setEmployees(employeesData);
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
    
    let roleMatch = true;
    if (filterRole === 'CAN_CASH_OUT') {
      roleMatch = employee.can_cash_out;
    } else if (filterRole === 'SUPPORT_DE_SALLE') {
      roleMatch = employee.role === 'SERVEUR' && !employee.can_cash_out;
    } else if (filterRole === 'CUISINIER') {
      roleMatch = employee.role === 'CUISINIER';
    } else if (filterRole !== 'all') {
      roleMatch = employee.role === filterRole;
    }

    return (nameMatch || emailMatch) && roleMatch;
  });

  const handleOpenInviteModal = () => {
    resetModalState();
    setIsInviteModalOpen(true);
  };

  const handleOpenEditModal = (employee) => {
    resetModalState();
    setCurrentEmployee(employee);
    setSelectedRole(employee.role || '');
    setPermissionCashOut(employee.can_cash_out);
    setIsEditModalOpen(true);
  };

  const resetModalState = () => {
    setInviteEmail('');
    setSelectedRole('');
    setCurrentEmployee(null);
    setPermissionCashOut(false);
    setSelectedInviteKey('');
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
    if (!selectedInviteKey) {
      setModalError(t('roleRequired', { ns: 'components/manager/manageEmployees' }));
      return;
    }

    const selectedRoleConfig = inviteRoles.find(r => r.key === selectedInviteKey);
    if (!selectedRoleConfig) {
      setModalError(t('invalidRoleSelection', { ns: 'components/manager/manageEmployees' }));
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      await inviteEmployee(inviteEmail, selectedRoleConfig.role, selectedRoleConfig.can_cash_out);
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
    setModalLoading(true);
    setModalError('');
    try {
      await updateEmployeeMembership(currentEmployee.membership_id, { role: selectedRole, can_cash_out: permissionCashOut });
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

  const handlePermissionChange = async (employee, checked) => {
    try {
      await updateEmployeeMembership(employee.membership_id, { can_cash_out: checked });
      showAlert(t('success'), t('permissionUpdatedSuccessfully', { ns: 'components/manager/manageEmployees' }));
      fetchData();
    } catch (err) {
      showAlert(t('error'), t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
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



  const getEmployeeInfo = (employee) => {
    let roleDisplayName;
    if (employee.role === 'SERVEUR' && !employee.can_cash_out) {
      roleDisplayName = t('supportDeSalle', { ns: 'components/manager/manageEmployees' });
    } else {
      roleDisplayName = t(employee.role.toLowerCase(), { ns: 'components/manager/manageEmployees' });
    }
    
    const cashOutStatus = employee.can_cash_out ? `(${t('canCashOut', { ns: 'components/manager/manageEmployees' })})` : '';

    return `${roleDisplayName} ${cashOutStatus}`;
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
                <InputLabel id="filter-role-label">{t('role', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                <Select
                  labelId="filter-role-label"
                  value={filterRole}
                  label={t('role', { ns: 'components/manager/manageEmployees' })}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">{t('all', { ns: 'common' })}</MenuItem>
                  <MenuItem value="CAN_CASH_OUT">{t('personneAyantPermission', { ns: 'components/manager/manageEmployees' })}</MenuItem>
                  <MenuItem value="SUPPORT_DE_SALLE">{t('supportDeSalle', { ns: 'components/manager/manageEmployees' })}</MenuItem>
                  <MenuItem value="CUISINIER">{t('cuisinier', { ns: 'components/manager/manageEmployees' })}</MenuItem>
                 
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
                    }}
                    secondaryAction={
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
                    }
                  >
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff' }}>{`${employee.first_name || ''} ${employee.last_name || ''} (${employee.email})`}</Typography>}
                      secondary={<Typography sx={{ color: '#ccc' }}>{getEmployeeInfo(employee)}</Typography>}
                    />
                  </ListItem>
                ))}
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
              if (inviteEmailError) {
                setInviteEmailError(validateEmail(e.target.value));
              }
            }}
            onBlur={() => setInviteEmailError(validateEmail(inviteEmail))}
            error={!!inviteEmailError}
            helperText={inviteEmailError}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="role-select-label">{t('role', { ns: 'components/manager/manageEmployees' })}</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedInviteKey}
              label={t('role', { ns: 'components/manager/manageEmployees' })}
              onChange={(e) => setSelectedInviteKey(e.target.value)}
            >
              {inviteRoles.map(item => (
                <MenuItem key={item.key} value={item.key}>{t(item.labelKey, { ns: 'components/manager/manageEmployees' })}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
            <InputLabel id="edit-role-select-label">{t('role', { ns: 'components/manager/manageEmployees' })}</InputLabel>
            <Select
              labelId="edit-role-select-label"
              value={selectedRole}
              label={t('role', { ns: 'components/manager/manageEmployees' })}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {predefinedRoles.map(role => (
                <MenuItem key={role} value={role}>{t(role.toLowerCase(), { ns: 'components/manager/manageEmployees' })}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={permissionCashOut} onChange={(e) => setPermissionCashOut(e.target.checked)} />}
            label={<Typography sx={{ color: 'black' }}>{t('cashOutPermission', { ns: 'components/manager/manageEmployees' })}</Typography>}
            sx={{ mb: 2 }}
          />
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
