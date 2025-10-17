import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box
} from '@mui/material';
import dayjs from 'dayjs';

const PoolDetailsModal = ({ open, onClose, pool, employees }) => {
  const { t } = useTranslation(['common']);

  const getEmployeeName = (userId) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  // Calculate total distributed hours and rate per hour
  const totalAmount = Number(pool?.total_amount || 0);
  const totalDistributedHours = pool?.distributions.reduce((sum, dist) => sum + Number(dist.hours_worked), 0) || 0;
  const ratePerHour = totalDistributedHours > 0 ? totalAmount / totalDistributedHours : 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Détails du Pool</DialogTitle>
      <DialogContent>
        {pool ? (
          <Box>
            <Typography variant="h6">{pool.department_name}</Typography>
            <Typography variant="body1" sx={{ color: 'black' }}>Période: {dayjs(pool.start_date).format('YYYY-MM-DD')} au {dayjs(pool.end_date).format('YYYY-MM-DD')}</Typography>
            <Typography variant="body1" sx={{ color: 'black' }}>{t('creationDate', { ns: 'common' })}: {dayjs(pool.created_at).format('YYYY-MM-DD HH:mm')}</Typography>
            <Typography variant="body1" sx={{ color: 'black' }}>{t('recipientCount', { ns: 'common' })}: {pool.distributions.length}</Typography>
            <Typography variant="body1" sx={{ color: 'black' }}>{t('totalDistributedHours', { ns: 'common' })}: {totalDistributedHours.toFixed(2)}</Typography>
            <Typography variant="body1" sx={{ color: 'black' }}>{t('ratePerHour', { ns: 'common' })}: {ratePerHour.toFixed(2)} $</Typography>
            <Typography variant="h5" sx={{ my: 2 }}>Montant Total: {totalAmount.toFixed(2)} $</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employé</TableCell>
                    <TableCell align="center">Heures Travaillées</TableCell>
                    <TableCell align="center">Montant Reçu</TableCell>
                    <TableCell align="center">{t('percentage', { ns: 'common' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pool.distributions.map((dist) => {
                    const percentage = totalAmount > 0 ? (Number(dist.distributed_amount) / totalAmount) * 100 : 0;
                    return (
                      <TableRow key={dist.user_id}>
                        <TableCell>{getEmployeeName(dist.user_id)}</TableCell>
                        <TableCell align="center">{Number(dist.hours_worked).toFixed(2)}</TableCell>
                        <TableCell align="center">{Number(dist.distributed_amount).toFixed(2)} $</TableCell>
                        <TableCell align="center">{percentage.toFixed(2)} %</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Typography>Chargement...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PoolDetailsModal;