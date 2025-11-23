import React, { createContext, useContext, useState } from 'react';

const DrawerContext = createContext(null);

export const useDrawer = () => useContext(DrawerContext);

export const DrawerProvider = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true); // Default to open on desktop

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  return (
    <DrawerContext.Provider value={{ mobileOpen, handleDrawerToggle, desktopOpen, handleDesktopToggle }}>
      {children}
    </DrawerContext.Provider>
  );
};