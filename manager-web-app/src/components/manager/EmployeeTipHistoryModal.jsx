import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, CircularProgress, List, ListItem, ListItemText, Box, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getEmployeeTipHistory } from '../../api/tipApi';

const EmployeeTipHistoryModal = ({ open, onClose, employee }) => {
  const { t } = useTranslation();
  const [tipHistory, setTipHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // For month filter
  const [selectedYear, setSelectedYear] = useState('');   // For year filter

  useEffect(() => {
    if (open && employee) {
      const fetchTipHistory = async () => {
        setLoading(true);
        setError('');
        try {
          const history = await getEmployeeTipHistory(employee.id, selectedMonth, selectedYear);
          setTipHistory(history);
        } catch (err) {
          setError(t(`error.${err.message}`) || t('common.somethingWentWrong'));
        } finally {
          setLoading(false);
        }
      };
      fetchTipHistory();
    } else {
      // Reset state when modal is closed
      setTipHistory([]);
      setLoading(true);
      setError('');
      setSelectedMonth(''); // Reset filters
      setSelectedYear('');  // Reset filters
    }
  }, [open, employee, t, selectedMonth, selectedYear]); // Add filters to dependency array

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('employeeTipHistory.titleForEmployee', { employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '' })}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>{t('common.month')}</InputLabel>
            <Select
              value={selectedMonth}
              label={t('common.month')}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {[...Array(12).keys()].map(i => (
                <MenuItem key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>{t('common.year')}</InputLabel>
            <Select
              value={selectedYear}
              label={t('common.year')}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {[...Array(5).keys()].map(i => {
                const year = new Date().getFullYear() - i;
                return <MenuItem key={year} value={year}>{year}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        )}
        {!loading && !error && (
          <>
            {employee && employee.role === 'server' ? (
              <>
                {tipHistory.length > 0 ? (
                  <List>
                    {tipHistory.map((dailyReport) => (
                      <ListItem key={dailyReport.service_date} sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {t('employeeTipHistory.serviceDate')}: {new Date(dailyReport.service_date).toLocaleDateString()}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Gross Tips: {parseFloat(dailyReport.gross_tips).toFixed(2)} $<br/>
                                Adjustments (Tip Outs): {parseFloat(dailyReport.total_adjustments).toFixed(2)} $<br/>
                                Net Tips: {parseFloat(dailyReport.net_tips).toFixed(2)} $
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ backgroundColor: '#333333', color: 'white', p: 1, borderRadius: 1, my: 2 }}>
                    {t('employeeTipHistory.noTipsRecordedForEmployee', { employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '' })}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body1" sx={{ backgroundColor: '#333333', color: 'white', p: 1, borderRadius: 1, my: 2 }}>
                {t('employeeTipHistory.noDetailedTipsForRole', { employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '', role: employee ? t('roles.' + employee.role) : '' })}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeTipHistoryModal;
