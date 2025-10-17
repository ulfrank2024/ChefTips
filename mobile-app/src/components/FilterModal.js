import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({
    isVisible,
    onClose,
    years,
    months,
    selectedYear,
    selectedMonth,
    onSelectYear,
    onSelectMonth,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{t('employeeTipHistory.filterTitle')}</Text>
                    <ScrollView style={{ width: "100%" }}>
                        <Text style={styles.sectionTitle}>{t('common.year')}</Text>
                        {years.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={styles.item}
                                onPress={() => onSelectYear(year)}
                            >
                                <Text style={styles.itemText}>{year}</Text>
                                {selectedYear === year && (
                                    <Ionicons name="checkmark" size={20} color="#ad9407ff" />
                                )}
                            </TouchableOpacity>
                        ))}
                        <Text style={styles.sectionTitle}>{t('common.month')}</Text>
                        {months.map((month) => (
                            <TouchableOpacity
                                key={month.value}
                                style={styles.item}
                                onPress={() => onSelectMonth(month.value)}
                            >
                                <Text style={styles.itemText}>{month.label}</Text>
                                {selectedMonth === month.value && (
                                    <Ionicons name="checkmark" size={20} color="#ad9407ff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { width: "100%", marginHorizontal: 0 }]}
                        onPress={onClose}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {t("common.close")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    modalContainer: {
        width: 300,
        maxHeight: 500,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    itemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
        marginRight: 10,
    },
    secondaryButton: {
        backgroundColor: "#6c757d",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 20,
    },
    secondaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default FilterModal;
