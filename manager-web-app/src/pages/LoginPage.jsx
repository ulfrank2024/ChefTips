import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Button, Grid, Link as MuiLink, Alert, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Fade } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './LoginPage.css';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const { t, i18n } = useTranslation('pages/login'); // Destructure i18n here
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
          const employeeDashboardPath = '/employee/dashboard';
          navigate(employeeDashboardPath, { replace: true });
        }
      }
    } catch (err) {
      setError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
    finally {
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
        const employeeDashboardPath = '/employee/dashboard';
        navigate(employeeDashboardPath, { replace: true });
      }
      setIsCompanySelectOpen(false);
    } catch (err) {
      setCompanySelectError(t(err.message, { ns: 'errors' }) || t('somethingWentWrong', { ns: 'common' }));
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fade in={true} timeout={500}>
        <Box sx={{ width: '100%', maxWidth: '400px', p: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '16px', backgroundColor: 'white', position: 'relative' }}> {/* Added position: 'relative' */}
                        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', mb: 2, height: { xs: 60, sm: 150 } }}>
          <img src={logo} alt="logo" style={{ height: '100%' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography component="h1" variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }}>
                            {t("title")}
                          </Typography>
                          <FormControl>
                            <Select
                              value={i18n.language}
                              onChange={(e) => i18n.changeLanguage(e.target.value)}
                              sx={{
                                height: { xs: 30, sm: 40 },
                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': { paddingRight: '24px', fontSize: { xs: '0.8rem', sm: '1rem' } },
                                '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', sm: '1.5rem' } },
                              }}
                            >
                              <MenuItem value="en" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>English</MenuItem>
                              <MenuItem value="fr" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Français</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        {error && (
                          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                            {error}
                          </Alert>
                        )}
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                          <TextField
                            margin="dense"
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
                            margin="dense"            required
            fullWidth
            name="password"
            label={t("password")}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, borderRadius: '8px', backgroundColor: '#ad9407ff', color: 'white', padding: '10px 0', fontSize: '1rem', '&:hover': { backgroundColor: '#9a7f06ff' } }} disabled={loading || !!emailError}>
            {loading ? t('loggingIn') : t("button")}
          </Button>
          <Grid container justifyContent="space-around" sx={{ mt: 2 }}>
            <Grid item>
              <MuiLink component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                {t("forgotPassword")}
              </MuiLink>
            </Grid>
            <Grid item>
              <MuiLink component={RouterLink} to="/signup" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                {t("noAccount")}
              </MuiLink>
            </Grid>
            <Grid item>
              <MuiLink component={RouterLink} to="/join-team" variant="body2" sx={{ color: "#ad9407ff", textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                {t("joinTeam")}
              </MuiLink>
            </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Fade>
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
              </>
            );
          };
          

export default LoginPage;
