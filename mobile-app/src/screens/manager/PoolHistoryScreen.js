import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Image,
    Dimensions,
} from "react-native";
import { getPoolHistory } from "../../api/tip/tipApi";
import { useIsFocused } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import LoadingOverlay from "../../components/LoadingOverlay";
import { LineChart } from "react-native-chart-kit";
import FilterModal from "../../components/FilterModal";

const PoolHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const isFocused = useIsFocused();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const [isChartVisible, setChartVisible] = useState(false);

    const fetchPools = async () => {
        setLoading(true);
        setError("");
        try {
            const history = await getPoolHistory();
            setPools(history);
        } catch (err) {
            console.error("Failed to fetch pool history:", err);
            setError(
                `${t("poolHistoryScreen.failedToLoadHistory")}${err.message}`
            );
            Alert.alert(
                t("poolHistoryScreen.error"),
                `${t("poolHistoryScreen.failedToLoadHistory")}${err.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchPools();
        }
    }, [isFocused]);

    const { filteredPools, totalAmount } = useMemo(() => {
        let filtered = pools;
        if (selectedYear) {
            filtered = filtered.filter(pool => new Date(pool.start_date).getFullYear() === selectedYear);
        }
        if (selectedMonth) {
            filtered = filtered.filter(pool => new Date(pool.start_date).getMonth() + 1 === selectedMonth);
        }
        const total = filtered.reduce((sum, pool) => sum + parseFloat(pool.total_amount), 0);
        return { filteredPools: filtered.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)), totalAmount: total };
    }, [pools, selectedYear, selectedMonth]);

    const years = useMemo(() => {
        const yearsSet = new Set(pools.map(pool => new Date(pool.start_date).getFullYear()));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [pools]);

    const months = [
        { label: t("common.allMonths"), value: null },
        { label: t("common.january"), value: 1 },
        { label: t("common.february"), value: 2 },
        { label: t("common.march"), value: 3 },
        { label: t("common.april"), value: 4 },
        { label: t("common.may"), value: 5 },
        { label: t("common.june"), value: 6 },
        { label: t("common.july"), value: 7 },
        { label: t("common.august"), value: 8 },
        { label: t("common.september"), value: 9 },
        { label: t("common.october"), value: 10 },
        { label: t("common.november"), value: 11 },
        { label: t("common.december"), value: 12 },
    ];

    const renderPoolItem = ({ item }) => {
        const formattedStartDate = new Date(
            item.start_date
        ).toLocaleDateString();
        const formattedEndDate = new Date(item.end_date).toLocaleDateString();
        const formattedTotalAmount = `${Number(item.total_amount).toFixed(2)} $`;

        return (
            <TouchableOpacity
                style={styles.poolItem}
                onPress={() =>
                    navigation.navigate("PoolDetails", { poolId: item.id })
                }
            >
                <View>
                    <Text style={styles.poolName}>{item.name}</Text>
                    <View style={styles.poolDetailsContainer}>
                        <View style={styles.periodContainer}>
                            <Text style={styles.poolDetailsText}>
                                {formattedStartDate}
                            </Text>
                            <Text style={styles.poolDetailsText}>
                                {t("poolHistoryScreen.to")} {formattedEndDate}
                            </Text>
                        </View>
                        <Text style={styles.poolDetailsText}>
                            {t("poolHistoryScreen.model")}{" "}
                            {item.distribution_model}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.amountBox}>
                        <Text style={styles.amountText}>
                            {formattedTotalAmount}
                        </Text>
                        <Text
                            style={
                                item.calculated_at
                                    ? styles.statusCalculated
                                    : styles.statusNotCalculated
                            }
                        >
                            {item.calculated_at
                                ? t("poolHistoryScreen.poolStatusCalculated")
                                : t(
                                      "poolHistoryScreen.poolStatusNotCalculated"
                                  )}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const chartData = {
        labels: filteredPools.map((item) => {
            const date = new Date(item.start_date);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            return `${month}/${year}`;
        }),
        datasets: [
            {
                data: filteredPools.map((item) => parseFloat(item.total_amount)),
            },
        ],
    };

    const chartConfig = {
        backgroundColor: "#01091F",
        backgroundGradientFrom: "#01091F",
        backgroundGradientTo: "#01091F",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#3498db",
        },
        paddingRight: 30,
        paddingLeft: 20,
    };

    return (
        <View style={styles.container}>
            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                years={years}
                months={months}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                onSelectMonth={setSelectedMonth}
            />

            <View style={styles.headerContainer}>
                <Image
                    source={require("../../../assets/logo/logoversion5.png")}
                    style={styles.logo}
                />
                <Text style={styles.title}>
                    {t("poolHistoryScreen.title")}
                </Text>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalText}>{t('poolHistoryScreen.totalPools')}: {totalAmount.toFixed(2)} $</Text>
            </View>

            <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                <Text style={styles.filterButtonText}>{t('employeeTipHistory.filterTitle')}</Text>
            </TouchableOpacity>

            {isChartVisible ? (
                <View style={styles.chartContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setChartVisible(false)}>
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color="#ad9407ff"
                            style={styles.chartLoader}
                        />
                    ) : error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : filteredPools.length > 0 ? (
                        <>
                            <Text style={styles.chartTitle}>
                                {t("poolHistoryScreen.poolSummary")}
                            </Text>
                            <LineChart
                                data={chartData}
                                width={Dimensions.get("window").width - 40}
                                height={280}
                                chartConfig={chartConfig}
                                style={styles.chart}
                                fromZero={true}
                                withHorizontalLabels={false}
                                withInnerLines={false}
                                withOuterLines={false}
                                renderDotContent={({x, y, index, indexData}) => {
                                    const day = new Date(filteredPools[index].start_date).getDate().toString();
                                    return (
                                        <View
                                            key={index}
                                            style={{
                                                position: "absolute",
                                                top: y - 30,
                                                left: x - 15,
                                                alignItems: "center",
                                                paddingBottom: 10,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "white",
                                                    fontSize: 10,
                                                }}
                                            >{`${Math.round(
                                                indexData
                                            )} $`}</Text>
                                            <View style={{flexDirection: 'row'}}>
                                                <Text
                                                    style={{
                                                        color: "#ad9407ff",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {t('poolHistoryScreen.jour')}
                                                </Text>
                                                <Text
                                                    style={{
                                                        color: "#ad9407ff",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {`(${day})`}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        </>
                    ) : (
                        <Text style={styles.noChartDataText}>
                            {t("poolHistoryScreen.noChartData")}
                        </Text>
                    )}
                </View>
            ) : (
                <TouchableOpacity style={styles.showChartButton} onPress={() => setChartVisible(true)}>
                    <Text style={styles.showChartButtonText}>{t("poolHistoryScreen.showChart")}</Text>
                </TouchableOpacity>
            )}

            {error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.createPoolButton}
                        onPress={fetchPools}
                    >
                        <Text style={styles.createPoolButtonText}>
                            {t("poolHistoryScreen.retry")}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : pools.length === 0 && !loading ? (
                <Text style={styles.noPoolsText}>
                    {t("poolHistoryScreen.noPoolsCreated")}
                </Text>
            ) : (
                <FlatList
                    data={filteredPools}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPoolItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {loading && <LoadingOverlay />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#01091F",
        paddingTop: 70,
        paddingHorizontal: 15,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#01091F",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#fff",
        marginLeft: 10,
    },
    poolItem: {
        backgroundColor: "#2a2a3e",
        padding: 18,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#1b2646ff",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    poolName: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 6,
    },
    periodContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    leftContent: {
        flex: 1,
        marginRight: 10,
    },
    infoRow: {
        flexDirection: "column",
        alignItems: "flex-end",
    },
    amountBox: {
        backgroundColor: "#ad9407ff",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 7,
        flexDirection: "column",
        alignItems: "center",
    },
    amountText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },
    statusCalculated: {
        color: "#90EE90",
        fontSize: 15,
        fontWeight: "bold",
        marginTop: 5,
    },
    statusNotCalculated: {
        color: "#FF6347",
        fontSize: 15,
        fontWeight: "bold",
        marginTop: 5,
    },
    poolDetailsContainer: {
        // This style is no longer directly used for a container, but its properties could be merged if necessary.
        // For now, I leave it as is but it will no longer be applied to a View.
    },
    poolDetailsText: {
        color: "#ccc",
        fontSize: 13,
        marginBottom: 3,
        flexShrink: 1,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    noPoolsText: {
        color: "#fff",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: "#2a2a3e",
        borderRadius: 8,
        fontWeight: "bold",
    },
    errorText: {
        color: "#dc3545",
        textAlign: "center",
        marginTop: 20,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
    },
    logo: {
        width: 55,
        height: 55,
        resizeMode: "contain",
    },
    createPoolButton: {
        backgroundColor: "#ad9407ff",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 20,
    },
    createPoolButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    totalContainer: {
        backgroundColor: '#1b2646ff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    totalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ad9407ff',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    chartContainer: {
        marginVertical: 15,
        borderRadius: 18,
        backgroundColor: "#1b2646ff",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 10,
    },
    chart: {
        borderRadius: 12,
        paddingTop: 35,
        paddingBottom:5,
    },
    chartLoader: {
        marginVertical: 20,
    },
    noChartDataText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 12,
        backgroundColor: "#2a2a3e",
        borderRadius: 8,
        fontWeight: "bold",
    },
    showChartButton: {
        backgroundColor: "#ad9407ff",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 20,
    },
    showChartButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "#dc3545",
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default PoolHistoryScreen;