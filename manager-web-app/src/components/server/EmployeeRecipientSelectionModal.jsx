import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Checkbox, FormControlLabel, FormGroup, Box, Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const EmployeeRecipientSelectionModal = ({
  open,
  onClose,
  employees,
  rule,
  initialSelected,
  onSave,
}) => {
  const { t } = useTranslation(['common', 'pages/serverDashboard']);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  useEffect(() => {
    if (open) {
      setSelectedEmployeeIds(initialSelected || []);
    }
  }, [open, initialSelected]);

  const handleCheckboxChange = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      const isSelected = prev.includes(employeeId);
      if (isSelected) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSave = () => {
    onSave(rule.id, selectedEmployeeIds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('selectRecipientsFor', { ns: 'pages/serverDashboard', ruleName: rule?.name || 'Rule' })}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {employees.map(employee => (
            <FormControlLabel
              key={employee.id}
              control={
                <Checkbox
                  checked={selectedEmployeeIds.includes(employee.id)}
                  onChange={() => handleCheckboxChange(employee.id)}
                  value={employee.id}
                  sx={{ color: 'black', '&.Mui-checked': { color: 'primary.main' } }}
                />
              }
              label={<Typography sx={{ color: 'black' }}>{`${employee.first_name} ${employee.last_name}`}</Typography>}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
        <Button onClick={handleSave} variant="contained">{t('save', { ns: 'common' })}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeRecipientSelectionModal;
