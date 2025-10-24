import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, TextField, Button, Paper, Grid, Link as MuiLink, Alert, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './LoginPage.css';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const { t } = useTranslation('pages/login');
  const { login, selectCompanyAndLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    if (!email) {
      return t('EMAIL_REQUIRED', { ns: 'errors' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return t('INVALID_EMAIL_FORMAT', { ns: 'errors' });
    }
    return '';
  };

  // State for multi-company selection
  const [isCompanySelectOpen, setIsCompanySelectOpen] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [tempUserId, setTempUserId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companySelectError, setCompanySelectError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setEmailError(''); // Réinitialiser l'erreur d'e-mail

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false); // Assurez-vous que le chargement est désactivé si la validation échoue
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success_code === "MULTIPLE_COMPANIES_CHOOSE_ONE") {
        setTempUserId(result.userId);
        setMemberships(result.memberships);
        setIsCompanySelectOpen(true);
      } else {
        // Direct login (single company)
        if (result.role === 'manager') {
          navigate('/dashboard', { replace: true });
        } else if (result.role === 'SERVEUR' || result.role === 'BARMAN' || result.role === 'COMMIS' || result.role === 'HOTE' || result.role === 'CUISINIER') {
          const employeeDashboardPath = result.can_cash_out ? '/employee/dashboard' : '/employee/dashboard/received-tips';
          navigate(employeeDashboardPath, { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelection = async () => {
    if (!selectedCompanyId) {
      setCompanySelectError(t('selectCompanyRequired'));
      return;
    }
    setLoading(true);
    setCompanySelectError('');
    try {
      const user = await selectCompanyAndLogin(tempUserId, selectedCompanyId);
      if (user.role === 'manager') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'SERVEUR' || user.role === 'BARMAN' || user.role === 'COMMIS' || user.role === 'HOTE' || user.role === 'CUISINIER') {
        const employeeDashboardPath = user.can_cash_out ? '/employee/dashboard' : '/employee/dashboard/received-tips';
        navigate(employeeDashboardPath, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      setIsCompanySelectOpen(false);
    } catch (err) {
      setCompanySelectError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className="login-paper" sx={{ backgroundColor: "#1b2646ff" }}>
        <img src={logo} alt="logo" style={{ height: 200, marginBottom: 16 }} />
        <Typography component="h1" variant="h5">
          {t("title")}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t("email")}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            error={!!emailError}
            helperText={emailError}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t("password")}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" className="login-submit" disabled={loading || !!emailError}>
            {loading ? t('loggingIn') : t("button")}
          </Button>
          <Grid container justifyContent="space-between">
            <Grid item>
              <MuiLink component={RouterLink} to="/forgot-password" variant="body2" sx={{ mt: 2, color: "#1b2646ff", textDecoration: "none" }}>
                {t("forgotPassword")}
              </MuiLink>
            </Grid>
            <Grid item>
              <MuiLink component={RouterLink} to="/signup" variant="body2" sx={{ mt: 2, color: "#1b2646ff", textDecoration: "none" }}>
                {t("noAccount")}
              </MuiLink>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
              <MuiLink component={RouterLink} to="/join-team" variant="body2" sx={{ color: "#ad9407ff", textDecoration: "none" }}>
                {t("joinTeam")}
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Company Selection Dialog */}
      <Dialog open={isCompanySelectOpen} onClose={() => setIsCompanySelectOpen(false)} disableEscapeKeyDown>
        <DialogTitle>{t('selectCompanyTitle')}</DialogTitle>
        <DialogContent>
          {companySelectError && <Alert severity="error" sx={{ mb: 2 }}>{companySelectError}</Alert>}
          <Typography>{t('selectCompanyMessage')}</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="company-select-label">{t('company')}</InputLabel>
            <Select
              labelId="company-select-label"
              value={selectedCompanyId}
              label={t('company')}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              {memberships.map((membership) => (
                <MenuItem key={membership.company_id} value={membership.company_id}>
                  {membership.company_name} ({membership.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCompanySelection} disabled={loading}>
            {loading ? t('loggingIn') : t('select', { ns: 'common' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LoginPage;