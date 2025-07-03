// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a', // Deep Blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#f97316', // Vibrant Orange
      contrastText: '#fff',
    },
    background: {
      default: '#f9fafb',
      paper: '#FFF9E5',
    },
    text: {
      primary: '#1A2A44',
      secondary: '#3b82f6',
    },
  },
  typography: {
    fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    body1: { fontSize: '1.1rem' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
