import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText,
  Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Select, MenuItem, FormControl, InputLabel, IconButton, Switch, FormGroup, FormControlLabel, useTheme, useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getTipOutRules, createTipOutRule, updateTipOutRule, deleteTipOutRule } from '../../api/tipApi';
import { getCompanyCategories } from '../../api/authApi';

const ManageTipOutRules = () => {
  const { t } = useTranslation(['components/manager/manageRules', 'common', 'errors']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleName, setRuleName] = useState('');
  const [destinationCategoryId, setDestinationCategoryId] = useState('');
  const [calculationBasis, setCalculationBasis] = useState('total_sales');
  const [percentage, setPercentage] = useState('');
  const [flatAmount, setFlatAmount] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, categoriesData] = await Promise.all([
        getTipOutRules(),
        getCompanyCategories(),
      ]);
      setRules(rulesData);
      setCategories(categoriesData.filter(cat => cat.is_tip_distribution_pool));
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
    setDestinationCategoryId('');
    setCalculationBasis('total_sales');
    setPercentage('');
    setFlatAmount('');
    setIsPercentage(true);
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
    setDestinationCategoryId(rule.destination_category_id || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmitRule = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      if (!ruleName || !destinationCategoryId) {
        setModalError(t('ruleNameAndDestinationRequired', { ns: 'components/manager/manageRules' }));
        setModalLoading(false);
        return;
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
        destination_category_id: destinationCategoryId,
        calculation_basis: calculationBasis,
        percentage: isPercentage ? parseFloat(percentage) : null,
        flat_amount: !isPercentage ? parseFloat(flatAmount) : null,
        distribution_type: 'DEPARTMENT_POOL', // Simplified to always be department pool
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
    const targetName = rule.destination_category_name || t('unspecifiedRecipients', { ns: 'components/manager/manageRules' });
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
                  <ListItem
                    key={rule.id}
                    sx={{
                      backgroundColor: '#2a2a3e',
                      padding: 2,
                      borderRadius: '10px',
                      mb: 1,
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                    }}
                    secondaryAction={isMobile ? null : (
                      <Box>
                        <IconButton onClick={() => handleOpenEditModal(rule)} sx={{ color: '#ad9407ff' }}><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDeleteClick(rule)} sx={{ color: '#dc3545' }}><DeleteIcon /></IconButton>
                      </Box>
                    )}
                  >
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{rule.name}</Typography>}
                      secondary={
                        <>
                          <Typography component="span" sx={{ color: '#ccc' }}>{getRuleDescription(rule)}</Typography>
                          {isMobile && (
                            <Box sx={{ mt: 1 }}>
                              <IconButton onClick={() => handleOpenEditModal(rule)} sx={{ color: '#ad9407ff' }}><EditIcon /></IconButton>
                              <IconButton onClick={() => handleDeleteClick(rule)} sx={{ color: '#dc3545' }}><DeleteIcon /></IconButton>
                            </Box>
                          )}
                        </>
                      }
                    />
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
            <InputLabel id="destination-category-select-label">{t('destinationCategory', { ns: 'components/manager/manageRules' })}</InputLabel>
            <Select
              labelId="destination-category-select-label"
              value={destinationCategoryId}
              label={t('destinationCategory', { ns: 'components/manager/manageRules' })}
              onChange={(e) => setDestinationCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
