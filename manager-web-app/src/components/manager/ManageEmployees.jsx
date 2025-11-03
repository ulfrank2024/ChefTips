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
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ManageEmployees.css';

import { useTheme, useMediaQuery } from '@mui/material';

const ManageEmployees = () => {
  const { t } = useTranslation(['common', 'errors', 'components/manager/manageEmployees']);
  const { showAlert } = useAlert();
  const { handleTokenUpdate } = useAuth();
  const navigate = useNavigate();
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
      const data = await updateEmployeeMembership(currentEmployee.membership_id, { role: selectedRole, can_cash_out: permissionCashOut });
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

  const handlePermissionChange = async (employee, checked) => {
    try {
      const data = await updateEmployeeMembership(employee.membership_id, { can_cash_out: checked });
      if (data.token) {
        handleTokenUpdate(data.token);
      }
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
                        <Box component="span"> {/* Changed to span to avoid div inside p warning */}
                          <Typography component="span" sx={{ color: '#ccc', display: 'block' }}>{getEmployeeInfo(employee)}</Typography>
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
              <FormControl fullWidth margin="dense">
                <InputLabel id="invite-role-label">{t('role', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                <Select
                  labelId="invite-role-label"
                  value={selectedInviteKey}
                  onChange={(e) => setSelectedInviteKey(e.target.value)}
                  label={t('role', { ns: 'components/manager/manageEmployees' })}
                >
                  {inviteRoles.map((role) => (
                    <MenuItem key={role.key} value={role.key}>
                      {t(role.labelKey, { ns: 'components/manager/manageEmployees' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                <InputLabel id="edit-role-label">{t('role', { ns: 'components/manager/manageEmployees' })}</InputLabel>
                <Select
                  labelId="edit-role-label"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label={t('role', { ns: 'components/manager/manageEmployees' })}
                  disabled={currentEmployee?.role === 'GERANT' || currentEmployee?.role === 'manager'}
                >
                  {predefinedRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {t(role.toLowerCase(), { ns: 'components/manager/manageEmployees' })}
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