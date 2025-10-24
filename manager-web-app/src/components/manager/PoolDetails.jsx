import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPools } from '../../api/tipApi';
import { useAlert } from '../../context/AlertContext';
import './PoolDetails.css'; // Pour les styles spécifiques

const PoolDetails = () => {
  const { t } = useTranslation();
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [poolDetails, setPoolDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPoolDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const report = await getPoolReport(poolId); // Call getPoolReport instead
      setPoolDetails(report);
    } catch (err) {
      console.error('Failed to fetch pool details:', err);
      setError(`${t('poolDetailsScreen.failedToLoadDetails')}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poolId) {
      fetchPoolDetails();
    }
  }, [poolId]);

  const handleCalculateDistribution = async () => {
    setLoading(true);
    try {
      await calculateDistribution(poolId);
      showAlert(t('success'), t('poolDetailsScreen.distributionCalculatedAndEmailsSent'));
      fetchPoolDetails(); // Rafraîchir les données après le calcul
    } catch (err) {
      console.error('Failed to calculate distribution:', err);
      showAlert(t('error'), `${t('poolDetailsScreen.failedToCalculateDistribution')}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>{t('poolDetailsScreen.loadingPoolDetails')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchPoolDetails}>
          {t('poolDetailsScreen.retry')}
        </Button>
      </Box>
    );
  }

  if (!poolDetails || !poolDetails.raw_report_data || poolDetails.raw_report_data.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('poolDetailsScreen.noDataFound')}</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          {t('poolDetailsScreen.back')}
        </Button>
      </Box>
    );
  }

  const poolInfo = poolDetails.pool_details;
  // Check if any item in raw_report_data has a distributed_amount to determine if calculated
  const isCalculated = poolDetails.raw_report_data.some(item => item.distributed_amount !== null && item.distributed_amount !== undefined);
  // Find the calculated_at date from the first distributed item, if any
  const poolCalculatedDate = isCalculated ? poolDetails.raw_report_data.find(item => item.calculated_at)?.calculated_at : null;

  return (
      <Box className="pool-details-container">
          <Box className="header-bar">
              <IconButton
                  onClick={() => navigate(-1)}
                  color="inherit"
                  sx={{ color: "white" }}
              >
                  <ArrowBackIcon />
              </IconButton>
              <Typography
                  variant="h5"
                  component="h1"
                  sx={{ flexGrow: 1, color: "white" }}
              >
                  {t("poolDetailsScreen.poolDetails")}
              </Typography>
          </Box>

          <Paper
              elevation={3}
              sx={{ p: 3, mb: 3, backgroundColor: "#2a2a3e", color: "black" }}
          >
              <Typography variant="h6" gutterBottom sx={{ color: "#ad9407ff" }}>
                  {poolInfo.pool_name}
              </Typography>
              <Typography variant="body1" sx={{ color: "black" }}>
                  {t("poolDetailsScreen.period")}
                  {new Date(poolInfo.start_date).toLocaleDateString()}
                  {t("poolDetailsScreen.to")}
                  {new Date(poolInfo.end_date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ color: "black" }}>
                  {t("poolDetailsScreen.totalAmount")}
                  {Number(poolInfo.total_amount).toFixed(2)} $
              </Typography>
              <Typography variant="body1" sx={{ color: "black" }}>
                  {t("poolDetailsScreen.distributionModel")}
                  {poolInfo.distribution_model}
              </Typography>
              {poolCalculatedDate && (
                  <Typography variant="body1" sx={{ backgroundColor: '#555', padding: '5px 10px', borderRadius: '5px', color: 'white' }}>
                      {t("poolDetailsScreen.calculatedOn")}
                      {new Date(poolCalculatedDate).toLocaleDateString()}
                  </Typography>
              )}
          </Paper>

          <Button
              variant="contained"
              onClick={handleCalculateDistribution}
              disabled={isCalculated}
              sx={{
                  mb: 3,
                  backgroundColor: isCalculated ? "#555" : "#ad9407ff",
                  "&:hover": {
                      backgroundColor: isCalculated ? "#555" : "#9a8406",
                  },
              }}
          >
              {t("poolDetailsScreen.calculateAndSendDistribution")}
          </Button>

          <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
              {t("poolDetailsScreen.distributionByEmployee")} (
              {poolDetails.raw_report_data.length})
          </Typography>

          <Paper
              elevation={3}
              sx={{ backgroundColor: "#1b2646ff", color: "white",padding:"20px" }}
          >
              <List>
                  {poolDetails.raw_report_data.map((item, index) => (
                      <React.Fragment key={index}>
                          <ListItem
                              sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                              }}
                          >
                              <ListItemText
                                  primary={
                                      <Typography
                                          variant="body1"
                                          sx={{ color: "white" }}
                                      >
                                          {item.first_name} {item.last_name} (
                                          {item.role || "N/A"})
                                      </Typography>
                                  }
                                  secondary={
                                      item.hours_worked && (
                                          <Typography
                                              variant="body2"
                                              sx={{ color: "#ccc" }}
                                          >
                                              {t(
                                                  "poolDetailsScreen.hoursWorked"
                                              )}
                                              {item.hours_worked}
                                          </Typography>
                                      )
                                  }
                              />
                              <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                              >
                                  {item.percentage_share && (
                                      <Typography
                                          variant="body1"
                                          sx={{
                                              mr: 2,
                                              backgroundColor: "#ad9407ff",
                                              padding: "5px 10px",
                                              borderRadius: "5px",
                                          }}
                                      >
                                          {item.percentage_share}%
                                      </Typography>
                                  )}
                                  {item.distributed_amount ? (
                                      <Typography
                                          variant="body1"
                                          sx={{
                                              backgroundColor: "#ad9407ff",
                                              padding: "5px 10px",
                                              borderRadius: "5px",
                                          }}
                                      >
                                          {`${item.distributed_amount} $`}
                                      </Typography>
                                  ) : (
                                      <Typography
                                          variant="body1"
                                          sx={{
                                              backgroundColor: "#555",
                                              padding: "5px 10px",
                                              borderRadius: "5px",
                                              color: "#ccc",
                                          }}
                                      >
                                          {t("poolDetailsScreen.notAvailable")}
                                      </Typography>
                                  )}
                              </Box>
                          </ListItem>
                          {index < poolDetails.raw_report_data.length - 1 && (
                              <Divider
                                  component="li"
                                  sx={{ backgroundColor: "#444" }}
                              />
                          )}
                      </React.Fragment>
                  ))}
              </List>
          </Paper>
      </Box>
  );
};

export default PoolDetails;
