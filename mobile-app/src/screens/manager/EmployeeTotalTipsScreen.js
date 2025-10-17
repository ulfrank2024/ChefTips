import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getEmployeesTotalTips } from '../../api/tip/tipApi'; // Assuming this API call will be created
import LoadingOverlay from '../../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useMemo } from 'react';

const EmployeeTotalTipsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEmployees = useMemo(() => {
        return employees.filter(employee =>
            employee.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [employees, searchQuery]);

    useEffect(() => {
        const fetchEmployeesTotalTips = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getEmployeesTotalTips(); // This API call needs to be implemented
                setEmployees(data);
            } catch (err) {
                console.error("Failed to fetch employees total tips:", err);
                setError(`${t("employeeTotalTipsScreen.failedToLoadTips")}${err.message}`);
                Alert.alert(t("common.error"), `${t("employeeTotalTipsScreen.failedToLoadTips")}${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeesTotalTips();
    }, []);

    const renderEmployeeItem = ({ item }) => (
        <View style={styles.employeeItem}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <Text style={styles.totalTips}>{t("employeeTotalTipsScreen.totalReceived")}: {item.totalTips.toFixed(2)} $</Text>
        </View>
    );

    if (loading) {
        return <LoadingOverlay />;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Image
                    source={require("../../../assets/logo/logoversion5.png")}
                    style={styles.headerLogo}
                />
                <Text style={styles.title}>
                    {t("employeeTotalTipsScreen.title")}
                </Text>
            </View>
            <View style={styles.zonehaut}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder={t("employeeTotalTipsScreen.searchPlaceholder")}
                    placeholderTextColor="#ccc"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredEmployees.length > 0 ? (
                <FlatList
                    data={filteredEmployees}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderEmployeeItem}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <Text style={styles.noEmployeesText}>
                    {t("employeeTotalTipsScreen.noEmployeesFound")}
                </Text>
            )}
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
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    backButton: {
        marginRight: 10,
        padding: 10,
        backgroundColor: "#ad9407ff",
        height: 40,
        width: 50,
        borderRadius:10,
    },
    headerLogo: {
        width: 50,
        height: 50,
        resizeMode: "contain",
        marginRight: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#fff",
        flex: 1,
    },
    searchInput: {
        height: 40,
        backgroundColor: "#2a2a3e",
        borderRadius: 8,
        paddingHorizontal: 15,
        color: "#fff",
        marginBottom: 20,
        fontSize: 16,
    },
    employeeItem: {
        backgroundColor: "#2a2a3e",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    employeeName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    totalTips: {
        color: "#ad9407ff",
        fontSize: 16,
        fontWeight: "bold",
    },
    listContent: {
        paddingBottom: 20,
    },
    noEmployeesText: {
        color: "#ccc",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
    },
    errorText: {
        color: "#dc3545",
        textAlign: "center",
        marginTop: 20,
    },
    zonehaut: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "space-around",
    },
});

export default EmployeeTotalTipsScreen;
