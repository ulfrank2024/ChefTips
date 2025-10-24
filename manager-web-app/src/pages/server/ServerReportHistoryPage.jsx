import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    TextField, // <-- 1. Ajout de l'importation manquante
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCashOutsByCollector } from "../../api/tipApi";

const ServerReportHistoryPage = () => {
    const { t } = useTranslation(["pages/serverDashboard", "common"]);
    const { user } = useAuth();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Utiliser dayjs sans argument pour l'heure actuelle, puis ajuster pour le début/fin de mois
    const [startDate, setStartDate] = useState(dayjs().startOf("month"));
    const [endDate, setEndDate] = useState(dayjs().endOf("month"));

    // Utilisation de useCallback pour stabiliser la fonction et l'utiliser dans useEffect
    const fetchReports = useCallback(
        async (start, end) => {
            try {
                setLoading(true);
                if (user && user.id && start && end) {
                    // Utiliser les paramètres passés plutôt que l'état local (pour l'appel initial)
                    const fetchedReports = await getCashOutsByCollector(
                        user.id,
                        start.toISOString(),
                        end.toISOString()
                    );
                    setReports(fetchedReports);
                } else {
                    // Uniquement afficher l'erreur si l'utilisateur est manquant, les dates devraient toujours être définies.
                    if (!user || !user.id) {
                        setError(
                            t("userIdMissing", {
                                ns: "errors",
                                defaultValue: "User ID is missing.",
                            })
                        );
                    }
                }
            } catch (err) {
                // Tenter de récupérer un message d'erreur spécifique, sinon utiliser un message générique
                const errorMessage = err.message || "somethingWentWrong";
                setError(
                    t(errorMessage, {
                        ns: "errors",
                        defaultValue: t("somethingWentWrong", { ns: "common" }),
                    })
                );
            } finally {
                setLoading(false);
            }
        },
        [user, t]
    ); // fetchReports dépend de user et t

    useEffect(() => {
        // 3. Appel initial au montage avec les dates initiales de l'état
        if (user && user.id) {
            fetchReports(startDate, endDate);
        }
    }, [user, fetchReports, startDate, endDate]); // 2. Dépendances mises à jour

    const handleApplyFilters = () => {
        // 3. L'appel pour les filtres utilise l'état local actuel
        fetchReports(startDate, endDate);
    };

    // Affichage du chargement et des erreurs
    if (loading && reports.length === 0)
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                <CircularProgress />
            </Box>
        );
    if (error && reports.length === 0)
        return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                {t("cashOutHistory", { ns: "pages/serverDashboard" })}
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    {/* Correction: 'center' pour alignItems assure un bon alignement en mode 'sm' */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems="center"
                    >
                        <DatePicker
                            label={t("startDate", { ns: "common" })}
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            // L'utilisation de TextField est correcte pour le rendu de l'input
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    margin: "normal",
                                },
                            }}
                        />
                        <DatePicker
                            label={t("endDate", { ns: "common" })}
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    margin: "normal",
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleApplyFilters}
                            sx={{ height: "56px" }}
                        >
                            {t("applyFilters", { ns: "pages/serverDashboard" })}
                        </Button>
                    </Stack>
                </LocalizationProvider>
            </Paper>

            {error &&
                reports.length > 0 && ( // Afficher l'erreur si elle existe, même avec des rapports existants
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            {t("cashOuts", { ns: "pages/serverDashboard" })}
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            {t("serviceDate", {
                                                ns: "pages/serverDashboard",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {t("category", { ns: "common" })}
                                        </TableCell>
                                        <TableCell>
                                            {t("totalSales", { ns: "common" })}
                                        </TableCell>
                                        <TableCell>
                                            {t("grossTips", { ns: "common" })}
                                        </TableCell>
                                        <TableCell>
                                            {t("netTips", {
                                                ns: "pages/serverDashboard",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {t("manualAdjustment", {
                                                ns: "common",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {t("serviceEndTime", {
                                                ns: "pages/serverDashboard",
                                            })}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && reports.length > 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                            >
                                                <CircularProgress size={24} />
                                            </TableCell>
                                        </TableRow>
                                    ) : reports.length > 0 ? (
                                        reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell>
                                                    {dayjs(
                                                        report.service_date
                                                    ).format("YYYY-MM-DD")}
                                                </TableCell>
                                                <TableCell>
                                                    {report.category_name}
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        report.total_sales
                                                    ).toFixed(2)}{" "}
                                                    $
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        report.gross_tips
                                                    ).toFixed(2)}{" "}
                                                    $
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        report.net_tips
                                                    ).toFixed(2)}{" "}
                                                    $
                                                </TableCell>
                                                <TableCell>
                                                    {/* 4. Correction: Fin de la fonction immédiate avec le '}' */}
                                                    {(() => {
                                                        // Assurez-vous que report.adjustments est une chaîne valide de JSON
                                                        const adjustmentsData =
                                                            report.adjustments
                                                                ? JSON.parse(
                                                                      report.adjustments
                                                                  )
                                                                : [];
                                                        const manualAdjustments =
                                                            Array.isArray(
                                                                adjustmentsData
                                                            )
                                                                ? adjustmentsData.filter(
                                                                      (adj) =>
                                                                          adj.adjustment_type ===
                                                                          "MANUAL"
                                                                  )
                                                                : [];

                                                        const totalManualAdjustment =
                                                            manualAdjustments.reduce(
                                                                (sum, adj) =>
                                                                    sum +
                                                                    parseFloat(
                                                                        adj.amount ||
                                                                            0
                                                                    ), // Assurez-vous d'utiliser 0 si amount est manquant
                                                                0
                                                            );
                                                        return (
                                                            totalManualAdjustment.toFixed(
                                                                2
                                                            ) + " $"
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {report.service_end_time
                                                        ? dayjs(
                                                              report.service_end_time
                                                          ).format("HH:mm")
                                                        : "N/A"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                            >
                                                {t("noCashOutsFound", {
                                                    ns: "pages/serverDashboard",
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ServerReportHistoryPage;
