import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';

const AlertDialog = () => {
    const { alert, hideAlert } = useAlert();
    const { t } = useTranslation('common');

    return (
        <Dialog
            open={alert.open}
            onClose={hideAlert}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{alert.title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {alert.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={hideAlert} color="primary" autoFocus>
                    {t('ok')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
