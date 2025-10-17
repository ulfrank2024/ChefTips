import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const AllEmployeesModal = ({
    isVisible,
    onClose,
    employees,
    renderEmployeeListItem, // Accept this prop
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEmployees = employees.filter(emp =>
        emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <Ionicons name="close-circle" size={24} color="#ccc" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{t("dashboardScreen.employeeList")}</Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder={t("employeeTotalTipsScreen.searchPlaceholder")}
                        placeholderTextColor="#aaaaaa"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    {filteredEmployees.length === 0 ? (
                        <Text style={styles.noEmployeesText}>{t("dashboardScreen.noEmployeesFound")}</Text>
                    ) : (
                        <FlatList
                            data={filteredEmployees}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderEmployeeListItem} // Use the passed prop
                            contentContainerStyle={styles.listContent}
                        />
                    )}

                    <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
                        <Text style={styles.closeModalButtonText}>{t("common.close")}</Text>
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
        width: "90%",
        height: "80%",
        backgroundColor: "#1b2646ff",
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
        color: "#fff",
        marginBottom: 15,
    },
    searchInput: {
        width: "100%",
        height: 40,
        backgroundColor: "#2a2a3e",
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: "#fff",
    },
    employeeListItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#f0f0f0",
        borderRadius: 5,
        marginBottom: 10,
    },
    employeeInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    employeeActionsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    employeeListItemText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
    employeeIcon: {
        marginRight: 8,
    },
    editButton: {
        padding: 5,
    },
    deleteButton: {
        padding: 5,
        marginLeft: 8,
    },
    noEmployeesText: {
        color: "#ccc",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
    },
    listContent: {
        flexGrow: 1,
        width: "100%",
    },
    closeModalButton: {
        backgroundColor: "#6c757d",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 20,
        width: "100%",
    },
    closeModalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default AllEmployeesModal;
