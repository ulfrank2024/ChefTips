import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Select, MenuItem, FormControl, InputLabel, IconButton, Switch, FormGroup, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getTipOutRules, createTipOutRule, updateTipOutRule, deleteTipOutRule } from '../../api/tipApi';

const ManageTipOutRules = () => {
  const { t } = useTranslation(['components/manager/manageRules', 'common', 'errors']);

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleName, setRuleName] = useState('');
  const [destinationRole, setDestinationRole] = useState(''); // New state for destination role
  const [calculationBasis, setCalculationBasis] = useState('total_sales');
  const [percentage, setPercentage] = useState('');
  const [flatAmount, setFlatAmount] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [distributionType, setDistributionType] = useState('INDIVIDUAL_SELECTION'); // New state
  const [individualRecipientRoles, setIndividualRecipientRoles] = useState([]); // New state for individual recipient roles
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const predefinedRoles = ['CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const rulesData = await getTipOutRules();
      setRules(rulesData);
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetModalState = () => {
    setEditingRule(null);
    setRuleName('');
    setDestinationRole('');
    setCalculationBasis('total_sales');
    setPercentage('');
    setFlatAmount('');
    setIsPercentage(true);
    setIndividualRecipientRoles([]);
    setModalError('');
  }

  const handleOpenCreateModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule) => {
    resetModalState();
    setEditingRule(rule);
    setRuleName(rule.name);
    setCalculationBasis(rule.calculation_basis || 'total_sales');
    if (rule.percentage) {
      setIsPercentage(true);
      setPercentage(rule.percentage);
    } else {
      setIsPercentage(false);
      setFlatAmount(rule.flat_amount);
    }
    setDistributionType(rule.distribution_type || 'INDIVIDUAL_SELECTION');
    setDestinationRole(rule.destination_role || '');
    let recipientRoles = rule.individual_recipient_roles;
    if (typeof recipientRoles === 'string') {
      try {
        recipientRoles = JSON.parse(recipientRoles);
      } catch (e) {
        console.error("Failed to parse individual_recipient_roles as JSON:", recipientRoles, e);
        recipientRoles = [];
      }
    }
    setIndividualRecipientRoles(Array.isArray(recipientRoles) ? recipientRoles : []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmitRule = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      if (!ruleName) {
        setModalError(t('ruleNameRequired', { ns: 'components/manager/manageRules' }));
        setModalLoading(false);
        return;
      }

      let finalDestinationRole = null;
      let finalIndividualRecipientRoles = [];

      if (distributionType === 'DEPARTMENT_POOL') {
        if (!destinationRole) {
          setModalError(t('destinationRoleRequired', { ns: 'components/manager/manageRules' }));
          setModalLoading(false);
          return;
        }
        finalDestinationRole = destinationRole;
      } else { // INDIVIDUAL_SELECTION
        if (individualRecipientRoles.length === 0) {
          setModalError(t('selectRecipientRoles', { ns: 'components/manager/manageRules' }));
          setModalLoading(false);
          return;
        }
        finalIndividualRecipientRoles = individualRecipientRoles;
      }

      if (isPercentage) {
        if (!percentage || isNaN(parseFloat(percentage))) {
          setModalError(t('percentageRequired', { ns: 'components/manager/manageRules' }));
          setModalLoading(false);
          return;
        }
      } else {
        if (!flatAmount || isNaN(parseFloat(flatAmount))) {
          setModalError(t('flatAmountRequired', { ns: 'components/manager/manageRules' }));
          setModalLoading(false);
          return;
        }
      }

      const ruleData = {
        name: ruleName,
        destination_role: finalDestinationRole,
        calculation_basis: calculationBasis,
        percentage: isPercentage ? parseFloat(percentage) : null,
        flat_amount: !isPercentage ? parseFloat(flatAmount) : null,
        distribution_type: distributionType,
        individual_recipient_roles: finalIndividualRecipientRoles,
      };

      if (editingRule) {
        await updateTipOutRule(editingRule.id, ruleData);
      } else {
        await createTipOutRule(ruleData);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      setModalError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteTipOutRule(ruleToDelete.id);
      setIsDeleteConfirmOpen(false);
      setRuleToDelete(null);
      fetchData();
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
  };

  const getRuleDescription = (rule) => {
    let targetName;
    let roles = rule.individual_recipient_roles;

    // Ensure roles is an array
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch (e) {
        console.error("Failed to parse individual_recipient_roles:", e);
        roles = [];
      }
    }
    
    if (rule.distribution_type === 'INDIVIDUAL_SELECTION' && Array.isArray(roles) && roles.length > 0) {
      targetName = roles.map(role => t((role || '').toLowerCase(), { ns: 'components/manager/manageRules' })).join(', ');
    } else if (rule.distribution_type === 'DEPARTMENT_POOL' && rule.destination_role) {
      targetName = t((rule.destination_role || '').toLowerCase(), { ns: 'components/manager/manageRules' });
    } else {
      targetName = t('unspecifiedRecipients', { ns: 'components/manager/manageRules' }); // New translation key
    }

    let description = `${t('ruleDescriptionTo', { ns: 'components/manager/manageRules' })} ${targetName}`;

    if (rule.percentage) {
        const basis = rule.calculation_basis === 'total_sales' ? t('ruleDescriptionOfTotalSales', { ns: 'components/manager/manageRules' }) : t('ruleDescriptionOfGrossTips', { ns: 'components/manager/manageRules' });
        description += ` (${rule.percentage}% ${t('ruleDescriptionOf', { ns: 'components/manager/manageRules' })} ${basis})`;
    } else if (rule.flat_amount) {
        description += ` (${rule.flat_amount} ${t('ruleDescriptionFlat', { ns: 'components/manager/manageRules' })})`;
    }
    
    return description;
  }
  


  return (
    <Box>
      <Typography variant="h5" component="h2">{t('title')}</Typography>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal} sx={{ mb: 3, backgroundColor: '#ad9407ff', '&:hover': { backgroundColor: '#9a8406' } }}>
            {t('createRule')}
          </Button>
          <Paper elevation={3} sx={{ p: 3 }}>
            {rules.length > 0 ? (
              <List>
                {rules.map((rule) => (
                  <ListItem key={rule.id} sx={{ backgroundColor: '#2a2a3e', padding: 2, borderRadius: '10px', mb: 1 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{rule.name}</Typography>}
                      secondary={<Typography sx={{ color: '#ccc' }}>{getRuleDescription(rule)}</Typography>}
                    />
                    <Box>
                      <IconButton onClick={() => handleOpenEditModal(rule)} sx={{ color: '#ad9407ff' }}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDeleteClick(rule)} sx={{ color: '#dc3545' }}><DeleteIcon /></IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ backgroundColor: '#f0f0f0', color: '#333', padding: '16px', borderRadius: '4px' }}>
                {t('noRules')}
              </Typography>
            )}
          </Paper>
        </>
      )}

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>{editingRule ? t('editRule') : t('createRule')}</DialogTitle>
        <DialogContent>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
          <TextField autoFocus margin="dense" label={t('ruleNamePlaceholder')} type="text" fullWidth value={ruleName} onChange={(e) => setRuleName(e.target.value)} sx={{ mb: 2 }} />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="distribution-type-label">{t('distributionType', { ns: 'components/manager/manageRules' })}</InputLabel>
            <Select
              labelId="distribution-type-label"
              value={distributionType}
              label={t('distributionType', { ns: 'components/manager/manageRules' })}
              onChange={(e) => setDistributionType(e.target.value)}
            >
              <MenuItem value="INDIVIDUAL_SELECTION">{t('individualSelection', { ns: 'components/manager/manageRules' })}</MenuItem>
              <MenuItem value="DEPARTMENT_POOL">{t('departmentPool', { ns: 'components/manager/manageRules' })}</MenuItem>
            </Select>
          </FormControl>

          {distributionType === 'INDIVIDUAL_SELECTION' ? (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="recipient-roles-select-label">{t('recipientRoles')}</InputLabel>
              <Select
                labelId="recipient-roles-select-label"
                multiple
                value={individualRecipientRoles}
                onChange={(e) => {
                  const { target: { value } } = e;
                  setIndividualRecipientRoles(
                    typeof value === 'string' ? value.split(',') : value,
                  );
                }}
                label={t('recipientRoles')}
              >
                {predefinedRoles.filter(role => role !== 'SERVEUR').map((role) => (
                  <MenuItem key={role} value={role}>
                    {t(role.toLowerCase(), { ns: 'components/manager/manageRules' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="destination-role-select-label">{t('destinationRole', { ns: 'components/manager/manageRules' })}</InputLabel>
              <Select
                labelId="destination-role-select-label"
                value={destinationRole}
                label={t('destinationRole', { ns: 'components/manager/manageRules' })}
                onChange={(e) => setDestinationRole(e.target.value)}
              >
                {predefinedRoles.filter(role => role !== 'manager').map((role) => (
                  <MenuItem key={role} value={role}>
                    {t(role.toLowerCase(), { ns: 'components/manager/manageRules' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <FormGroup row sx={{ alignItems: 'center', mb: 2 }}>
            <Typography color="text.secondary">{t('flatAmount')}</Typography>
            <Switch checked={isPercentage} onChange={(e) => setIsPercentage(e.target.checked)} />
            <Typography color="text.secondary">{t('percentage')}</Typography>
          </FormGroup>
          {isPercentage ? (
            <>

              <TextField margin="dense" label={t('percentagePlaceholder')} type="number" fullWidth value={percentage} onChange={(e) => setPercentage(e.target.value)} />
            </>
          ) : (
            <TextField margin="dense" label={t('flatAmountPlaceholder')} type="number" fullWidth value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleSubmitRule} disabled={modalLoading}>{modalLoading ? <CircularProgress size={24} /> : t('save', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDeleteTitle')}</DialogTitle>
        <DialogContent><DialogContentText>{t('confirmDeleteMessage', { ruleName: ruleToDelete?.name })}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>{t('cancel', { ns: 'common' })}</Button>
          <Button onClick={handleDeleteConfirm} color="error">{t('delete', { ns: 'common' })}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageTipOutRules;
