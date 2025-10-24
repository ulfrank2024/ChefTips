import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../../api/tip/tipApi'; // Assuming this API exists
import ErrorModal from '../../components/ErrorModal';

const CategorySelectionScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                const user = JSON.parse(userString);
                if (!user || !user.company_id) {
                    throw new Error('USER_OR_COMPANY_ID_MISSING');
                }
                const fetchedCategories = await getCategories(user.company_id);
                // Filter categories to only show those where department_type is 'COLLECTOR'
                const collectorCategories = fetchedCategories.filter(cat => cat.department_type === 'COLLECTOR');
                setCategories(collectorCategories);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                const errorCode = err.message;
                const translatedMessage = t(`error.${errorCode}`);
                const finalMessage = translatedMessage.startsWith('error.') ? t('common.somethingWentWrong') : translatedMessage;
                setModalTitle(t('common.error'));
                setModalMessage(finalMessage);
                setModalVisible(true);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [t]);

    const handleSelectCategory = async (category) => {
        try {
            // Store the selected category temporarily
            await AsyncStorage.setItem('selectedCategoryForReport', JSON.stringify(category));
            // Navigate to the daily report screen (to be created)
            navigation.replace('DailyReportInput'); // This screen needs to be defined in AppNavigator
        } catch (error) {
            console.error("Failed to save selected category:", error);
            setModalTitle(t('common.error'));
            setModalMessage(t('categorySelection.saveError'));
            setModalVisible(true);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ad9407ff" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ErrorModal
                isVisible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
            <Text style={styles.title}>{t('categorySelection.title')}</Text>
            {categories.length === 0 ? (
                <Text style={styles.noCategoriesText}>{t('categorySelection.noCategories')}</Text>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.categoryItem}
                            onPress={() => handleSelectCategory(item)}
                        >
                            <Text style={styles.categoryName}>{item.name}</Text>
                            <Text style={styles.departmentType}>{t(`departmentType.${item.department_type}`)}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#01091F',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#01091F',
    },
    loadingText: {
        color: '#ffffff',
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
        textAlign: 'center',
    },
    categoryItem: {
        backgroundColor: '#1b2646ff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    departmentType: {
        fontSize: 14,
        color: '#cccccc',
    },
    noCategoriesText: {
        color: '#cccccc',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
});

export default CategorySelectionScreen;
