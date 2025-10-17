import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Button, Image, TouchableOpacity } from 'react-native';
import { getEmployeeTipHistory } from '../../api/tip/tipApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import FilterModal from '../../components/FilterModal';

const EmployeeTipHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isFocused = useIsFocused();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const fetchTipHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const userString = await AsyncStorage.getItem('user');
            const user = JSON.parse(userString);
            if (user && user.id) {
                const history = await getEmployeeTipHistory(user.id);
                setTips(history);
            } else {
                setError(t('employeeTipHistory.userIdNotFound'));
            }
        } catch (err) {
            console.error(t('employeeTipHistory.failedToLoadHistory'), err);
            setError(`${t('employeeTipHistory.failedToLoadHistory')}${err.message}`);
            Alert.alert(t('employeeTipHistory.error'), `${t('employeeTipHistory.failedToLoadHistory')}${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchTipHistory();
        }
    }, [isFocused]);

    const { filteredTips, totalAmount } = useMemo(() => {
        let filtered = tips;
        if (selectedYear) {
            filtered = filtered.filter(tip => new Date(tip.calculated_at).getFullYear() === selectedYear);
        }
        if (selectedMonth) {
            filtered = filtered.filter(tip => new Date(tip.calculated_at).getMonth() + 1 === selectedMonth);
        }
        const total = filtered.reduce((sum, tip) => sum + parseFloat(tip.distributed_amount), 0);
        return { filteredTips: filtered, totalAmount: total };
    }, [tips, selectedYear, selectedMonth]);

    const years = useMemo(() => {
        const yearsSet = new Set(tips.map(tip => new Date(tip.calculated_at).getFullYear()));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [tips]);

    const months = [
        { label: t('common.allMonths'), value: null },
        { label: t('common.january'), value: 1 },
        { label: t('common.february'), value: 2 },
        { label: t('common.march'), value: 3 },
        { label: t('common.april'), value: 4 },
        { label: t('common.may'), value: 5 },
        { label: t('common.june'), value: 6 },
        { label: t('common.july'), value: 7 },
        { label: t('common.august'), value: 8 },
        { label: t('common.september'), value: 9 },
        { label: t('common.october'), value: 10 },
        { label: t('common.november'), value: 11 },
        { label: t('common.december'), value: 12 },
    ];

    const renderTipItem = ({ item }) => {
        const calculatedDate = item.calculated_at ? new Date(item.calculated_at).toLocaleDateString() : 'N/A';
        return (
            <View style={styles.tipItemContainer}>
                <View style={styles.amountContainer}>
                    <Ionicons name="cash-outline" size={24} color='#ad9407ff' />
                    <Text style={styles.tipAmount}>{item.distributed_amount} $</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={16} color='#6c757d' style={styles.icon} />
                        <Text style={styles.detailText}>{item.pool_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color='#6c757d' style={styles.icon} />
                        <Text style={styles.detailText}>{new Date(item.start_date).toLocaleDateString()} {t('employeeTipHistory.to')} {new Date(item.end_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color='#6c757d' style={styles.icon} />
                        <Text style={styles.detailText}>{t('employeeTipHistory.calculatedOn')}</Text>
                        <Text style={styles.detailText}>{calculatedDate}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ad9407ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title={t('employeeTipHistory.retry')} onPress={fetchTipHistory} color="#ad9407ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                years={years}
                months={months}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onSelectYear={setSelectedYear}
                onSelectMonth={setSelectedMonth}
            />
            <View style={styles.titleContainer}>
                <Image source={require('../../../assets/logo/logoversion5.png')} style={styles.logo} />
                <Text style={styles.title}>{t('employeeTipHistory.myTipHistory')}</Text>
            </View>
            <View style={styles.totalContainer}>
                <Text style={styles.totalText}>{t('employeeTipHistory.totalTips')}: {totalAmount.toFixed(2)} $</Text>
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                <Ionicons name="filter" size={20} color="#fff" />
                <Text style={styles.filterButtonText}>{t('employeeTipHistory.filterTitle')}</Text>
            </TouchableOpacity>
            {filteredTips.length === 0 ? (
                <View style={styles.centeredContent}>
                    <Text style={styles.noTipsText}>{t('employeeTipHistory.noTipsRecorded')}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTips}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderTipItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 15,
        backgroundColor: '#01091F',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#01091F',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 10,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#fff',
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
    tipItemContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    amountContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 15,
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    tipAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ad9407ff',
        marginTop: 5,
    },
    detailsContainer: {
        flex: 1,
        paddingLeft: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        marginRight: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        flexShrink: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    noTipsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#ccc',
    },
    errorText: {
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
    },
});

export default EmployeeTipHistoryScreen;
