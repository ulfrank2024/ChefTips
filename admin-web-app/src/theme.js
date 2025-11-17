import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ad9407', // Gold color from the app
      dark: '#1b2646', // Darker blue for AppBar and now sidebar
    },
    secondary: {
      main: '#6c757d', // Grey for secondary actions
    },
    error: {
      main: '#dc3545', // Red for errors/delete actions
    },
    background: {
      default: '#ffffff', // Dark blue background
      paper: '#ffffffff',   // Couleur de fond du formulaire de connexion
    },
    text: {
      primary: '#333333', // Dark text for light backgrounds (on paper)
      secondary: '#aaaaaa', // Lighter grey text
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1b2646', // Darker blue for AppBar, as seen in mobile
        },
      },
    },
    MuiButton: {
        styleOverrides: {
            containedPrimary: {
                color: '#ffffff', // White text on primary buttons
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                color: '#333333', // Ensure text on paper is dark
            }
        }
    },
    MuiContainer: {
        styleOverrides: {
            root: {
                color: '#333333', // Default text color in a container should be dark for the light background
            }
        }
    },
    
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#333333 !important', // Ensure label text is dark
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: '#333333 !important', // Ensure selected text is dark
        },
        icon: {
          color: '#333333 !important', // Ensure dropdown icon is dark
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#333333 !important', // Ensure menu item text is dark
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#000000 !important', // Ensure input text is black
        },
      },
    },
  },
});

export default theme;
