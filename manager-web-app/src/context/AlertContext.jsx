import React, { createContext, useState, useContext, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
    return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        open: false,
        title: '',
        message: '',
    });

    const showAlert = useCallback((title, message) => {
        setAlert({ open: true, title, message });
    }, []);

    const hideAlert = () => {
        setAlert({ open: false, title: '', message: '' });
    };

    const value = {
        alert,
        showAlert,
        hideAlert,
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
        </AlertContext.Provider>
    );
};
