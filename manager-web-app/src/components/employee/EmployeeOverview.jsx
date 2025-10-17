import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getEmployeeReceivedTips,
  getPoolSummary,
  getPoolDetails,
} from "../../api/tipApi";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SpeedIcon from "@mui/icons-material/Speed";

const EmployeeOverview = () => {
  const { t } = useTranslation(["common", "pages/employeeDashboard"]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [receivedTips, setReceivedTips] = useState([]);
  const [latestPool, setLatestPool] = useState(null); // New state for latest pool
  const [loading, setLoading] = useState(true);
  const [loadingLatestPool, setLoadingLatestPool] = useState(false); // New state for loading latest pool
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceivedTipsAndLatestPool = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const tips = await getEmployeeReceivedTips(user.id);
          setReceivedTips(tips);

          // Find the latest pool_id from the received tips
          if (tips.length > 0) {
            // Sort tips by pool_created_at to find the truly latest pool
            const sortedTips = tips.sort(
              (a, b) =>
                dayjs(b.pool_created_at).unix() -
                dayjs(a.pool_created_at).unix()
            );
            const latestPoolId = sortedTips[0].pool_id;

            setLoadingLatestPool(true);
            const poolDetails = await getPoolDetails(latestPoolId); // Use getPoolDetails

            // Find the current employee's distributed amount from the details
            const employeeDistribution =
              poolDetails.distributions.find(
                (dist) => dist.user_id === user.id
              );

            // Create a new object that combines pool details with employee's distributed amount
            const latestPoolWithEmployeeAmount = {
              ...poolDetails,
              employeeDistributedAmount: employeeDistribution
                ? employeeDistribution.distributed_amount
                : 0,
            };

            setLatestPool(latestPoolWithEmployeeAmount);
            setLoadingLatestPool(false);
          }
        } else {
          setError(
            t("userIdNotFound", { ns: "pages/employeeDashboard" })
          );
        }
      } catch (err) {
        setError(
          t(err.message, { ns: "errors" }) ||
          t("somethingWentWrong", { ns: "common" })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedTipsAndLatestPool();
  }, [user, t]);

  const { totalCurrentMonth, totalLastMonth, totalCurrentYear } =
    useMemo(() => {
      const now = dayjs();
      const currentMonth = now.month();
      const currentYear = now.year();
      const lastMonth = now.subtract(1, "month").month();

      let totalCurrentMonth = 0;
      let totalLastMonth = 0;
      let totalCurrentYear = 0;

      receivedTips.forEach((tip) => {
        const tipDate = dayjs(tip.start_date);
        const tipMonth = tipDate.month();
        const tipYear = tipDate.year();
        const amount = Number(tip.distributed_amount);

        if (tipYear === currentYear) {
          totalCurrentYear += amount;
          if (tipMonth === currentMonth) {
            totalCurrentMonth += amount;
          }
          if (tipMonth === lastMonth) {
            totalLastMonth += amount;
          }
        }
      });

      return { totalCurrentMonth, totalLastMonth, totalCurrentYear };
    }, [receivedTips]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
      <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
              {t("overview", { ns: "pages/employeeDashboard" })}
          </Typography>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" gutterBottom>
                      {t("welcome", { ns: "common" })},{" "}
                      {user?.first_name || "Employee"}!
                  </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" color="text.secondary">
                      {user?.company_name}
                  </Typography>
              </Box>
          </Paper>

          <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Latest Pool Information */}
              {loadingLatestPool ? (
                  <Grid item xs={12} md={6}>
                      <Paper
                          elevation={3}
                          sx={{
                              p: 3,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              minHeight: "200px",
                          }}
                      >
                          <CircularProgress />
                      </Paper>
                  </Grid>
              ) : latestPool ? (
                  <Grid item xs={12} md={6}>
                      <Card elevation={3}>
                          <CardHeader
                              avatar={<AccessTimeIcon color="primary" />}
                              title={
                                  <Typography variant="h6" component="h2">
                                      {t("latestPoolSummary", {
                                          ns: "pages/employeeDashboard",
                                      })}
                                  </Typography>
                              }
                              sx={{ pb: 0 }}
                          />
                          <CardContent>
                              <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <BusinessIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("department", {
                                                  ns: "common",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  fontWeight: "bold",
                                                  color: "text.primary",
                                              }}
                                          >
                                              {latestPool.department_name}
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <ScheduleIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("period", { ns: "common" })}:
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  fontWeight: "bold",
                                                  color: "text.primary",
                                              }}
                                          >
                                              {dayjs(
                                                  latestPool.start_date
                                              ).format("YYYY-MM-DD")}{" "}
                                              -{" "}
                                              {dayjs(
                                                  latestPool.end_date
                                              ).format("YYYY-MM-DD")}
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <AccessTimeIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("creationDate", {
                                                  ns: "common",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  color: "text.primary",
                                              }}
                                          >
                                              {dayjs(
                                                  latestPool.created_at
                                              ).format("YYYY-MM-DD HH:mm")}
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <PeopleIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("recipientCount", {
                                                  ns: "common",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  color: "text.primary",
                                              }}
                                          >
                                              {latestPool.recipient_count || 0}
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <ScheduleIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("totalDistributedHours", {
                                                  ns: "common",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  color: "text.primary",
                                              }}
                                          >
                                              {Number(
                                                  latestPool.total_distributed_hours
                                              ).toFixed(2)}
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <SpeedIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "text.secondary",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("ratePerHour", {
                                                  ns: "common",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="body1"
                                              sx={{
                                                  ml: 1,
                                                  color: "text.primary",
                                              }}
                                          >
                                              {(
                                                  Number(
                                                      latestPool.total_amount
                                                  ) /
                                                  (Number(
                                                      latestPool.total_distributed_hours
                                                  ) || 1)
                                              ).toFixed(2)}{" "}
                                              $
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <AttachMoneyIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "success.main",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("yourDistributedAmount", {
                                                  ns: "pages/employeeDashboard",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="h6"
                                              sx={{
                                                  ml: 1,
                                                  color: "success.main",
                                                  fontWeight: "bold",
                                              }}
                                          >
                                              {Number(
                                                  latestPool.employeeDistributedAmount
                                              ).toFixed(2)}{" "}
                                              $
                                          </Typography>
                                      </Box>
                                      <Box
                                          sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              mb: 1,
                                          }}
                                      >
                                          <AttachMoneyIcon
                                              sx={{
                                                  mr: 1,
                                                  fontSize: "small",
                                                  color: "primary.main",
                                              }}
                                          />
                                          <Typography
                                              variant="body2"
                                              color="text.secondary"
                                          >
                                              {t("totalPoolAmount", {
                                                  ns: "pages/employeeDashboard",
                                              })}
                                              :
                                          </Typography>
                                          <Typography
                                              variant="h6"
                                              sx={{
                                                  ml: 1,
                                                  color: "primary.main",
                                                  fontWeight: "bold",
                                              }}
                                          >
                                              {Number(
                                                  latestPool.total_amount
                                              ).toFixed(2)}{" "}
                                              $
                                          </Typography>
                                      </Box>
                                  </Grid>
                              </Grid>
                          </CardContent>
                      </Card>
                  </Grid>
              ) : (
                  <></>
              )}

              <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                          {t("statistics", { ns: "pages/employeeDashboard" })}
                      </Typography>

                      <Grid container spacing={2} sx={{ mt: 2 }}>
                          <Grid item xs={12} md={4}>
                              <Paper
                                  elevation={1}
                                  sx={{ p: 2, textAlign: "center" }}
                              >
                                  <Typography variant="subtitle1">
                                      {t("totalCurrentMonth", {
                                          ns: "pages/employeeDashboard",
                                      })}
                                  </Typography>
                                  <Typography variant="h5" color="primary">
                                      {totalCurrentMonth.toFixed(2)} $
                                  </Typography>
                              </Paper>
                          </Grid>
                          <Grid item xs={12} md={4}>
                              <Paper
                                  elevation={1}
                                  sx={{ p: 2, textAlign: "center" }}
                              >
                                  <Typography variant="subtitle1">
                                      {t("totalLastMonth", {
                                          ns: "pages/employeeDashboard",
                                      })}
                                  </Typography>
                                  <Typography variant="h5" color="primary">
                                      {totalLastMonth.toFixed(2)} $
                                  </Typography>
                              </Paper>
                          </Grid>
                          <Grid item xs={12} md={4}>
                              <Paper
                                  elevation={1}
                                  sx={{ p: 2, textAlign: "center" }}
                              >
                                  <Typography variant="subtitle1">
                                      {t("totalCurrentYear", {
                                          ns: "pages/employeeDashboard",
                                      })}
                                  </Typography>
                                  <Typography variant="h5" color="primary">
                                      {totalCurrentYear.toFixed(2)} $
                                  </Typography>
                              </Paper>
                          </Grid>
                      </Grid>

                      <Button
                          variant="contained"
                          color="primary"
                          sx={{ mt: 3 }}
                          onClick={() =>
                              navigate("/employee/dashboard/received-tips")
                          }
                      >
                          {t("viewAllTips", {
                              ns: "pages/employeeDashboard",
                          })}
                      </Button>
                  </Paper>
              </Grid>
          </Grid>
      </Box>
  );
};

export default EmployeeOverview;
