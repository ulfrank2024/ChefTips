import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import './i18n'; // Initialize i18next
import { DrawerProvider } from './context/DrawerContext'; // Import DrawerProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback="Loading...">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DrawerProvider> {/* Add DrawerProvider here */}
          <App />
        </DrawerProvider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>
);
