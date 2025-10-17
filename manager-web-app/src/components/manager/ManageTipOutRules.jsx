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
import { getCategories, getDepartments } from '../../api/tipApi';
import { getTipOutRules, createTipOutRule, updateTipOutRule, deleteTipOutRule } from '../../api/tipApi';

const ManageTipOutRules = () => {
  const { t } = useTranslation(['components/manager/manageRules', 'common', 'errors']);

  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleName, setRuleName] = useState('');
  const [destinationDepartmentId, setDestinationDepartmentId] = useState('');
  const [sourceCategoryId, setSourceCategoryId] = useState('');
  const [calculationBasis, setCalculationBasis] = useState('gross_tips');
  const [percentage, setPercentage] = useState('');
  const [flatAmount, setFlatAmount] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [distributionType, setDistributionType] = useState('DEPARTMENT_POOL'); // New state for distribution type
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, categoriesData, departmentsData] = await Promise.all([
        getTipOutRules(),
        getCategories(),
        getDepartments()
      ]);
      setRules(rulesData);
      setCategories(categoriesData);
      setDepartments(departmentsData);
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
    setDestinationDepartmentId('');
    setSourceCategoryId('');
    setCalculationBasis('gross_tips');
    setPercentage('');
    setFlatAmount('');
    setIsPercentage(true);
    setDistributionType('DEPARTMENT_POOL'); // Reset distribution type
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
    setDestinationDepartmentId(rule.destination_department_id);
    setSourceCategoryId(rule.source_category_id || '');
    setCalculationBasis(rule.calculation_basis || 'gross_tips');
    if (rule.percentage) {
      setIsPercentage(true);
      setPercentage(rule.percentage);
    } else {
      setIsPercentage(false);
      setFlatAmount(rule.flat_amount);
    }
    setDistributionType(rule.distribution_type || 'DEPARTMENT_POOL'); // Set distribution type
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmitRule = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const ruleData = {
        name: ruleName,
        destination_department_id: destinationDepartmentId,
        source_category_id: sourceCategoryId || null,
        calculation_basis: calculationBasis,
        percentage: isPercentage ? parseFloat(percentage) : null,
        flat_amount: !isPercentage ? parseFloat(flatAmount) : null,
        distribution_type: distributionType, // Include distribution type
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
    const destDepartment = departments.find(d => d.id === rule.destination_department_id)?.name || 'N/A';
    let description = `To: ${destDepartment}`;
    if (rule.percentage) {
        const basis = rule.calculation_basis === 'total_sales' ? 'Total Sales' : 'Gross Tips';
        description += ` (${rule.percentage}% of ${basis})`;
    } else if (rule.flat_amount) {
        description += ` (${rule.flat_amount} flat)`;
    }
    if (rule.source_category_id) {
        const srcCategory = categories.find(c => c.id === rule.source_category_id)?.name || 'N/A';
        description += ` from ${srcCategory} only`;
    }
    description += ` [Type: ${rule.distribution_type === 'INDIVIDUAL_SELECTION' ? 'Individual' : 'Department Pool'}]`; // Add distribution type
    return description;
  }
  
  const receiverDepartments = departments.filter(d => d.department_type === 'RECEIVER');
  const collectorDepartments = departments.filter(d => d.department_type === 'COLLECTOR');
  const collectorCategories = categories.filter(c => collectorDepartments.some(d => d.id === c.department_id));

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
            <InputLabel>{t('destinationDepartment')}</InputLabel>
            <Select value={destinationDepartmentId} label={t('destinationDepartment')} onChange={(e) => setDestinationDepartmentId(e.target.value)}>
              {receiverDepartments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('sourceCategory')} ({t('optional', { ns: 'common' })})</InputLabel>
            <Select value={sourceCategoryId} label={`${t('sourceCategory')} (${t('optional', { ns: 'common' })})`} onChange={(e) => setSourceCategoryId(e.target.value)}>
              <MenuItem value="">{t('all', { ns: 'common' })}</MenuItem>
              {collectorCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('distributionType')}</InputLabel>
            <Select value={distributionType} label={t('distributionType')} onChange={(e) => setDistributionType(e.target.value)}>
              <MenuItem value="DEPARTMENT_POOL">{t('departmentPool')}</MenuItem>
              <MenuItem value="INDIVIDUAL_SELECTION">{t('individualSelection')}</MenuItem>
            </Select>
          </FormControl>

          <FormGroup row sx={{ alignItems: 'center', mb: 2 }}>
            <Typography color="text.secondary">{t('flatAmount')}</Typography>
            <Switch checked={isPercentage} onChange={(e) => setIsPercentage(e.target.checked)} />
            <Typography color="text.secondary">{t('percentage')}</Typography>
          </FormGroup>
          {isPercentage ? (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('calculationBasis')}</InputLabel>
                <Select value={calculationBasis} label={t('calculationBasis')} onChange={(e) => setCalculationBasis(e.target.value)}>
                  <MenuItem value="gross_tips">{t('grossTips')}</MenuItem>
                  <MenuItem value="total_sales">{t('totalSales')}</MenuItem>
                </Select>
              </FormControl>
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
