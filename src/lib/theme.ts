"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#002050" },
    secondary: { main: "#0078d4" },
    background: {
      default: "#f0f2f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    subtitle1: { fontWeight: 600, lineHeight: 1.35 },
    subtitle2: { fontWeight: 600 },
    caption: { fontWeight: 500, letterSpacing: "0.01em" },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderColor: "#e3e5e8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            borderColor: "#cdd0d4",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        sizeSmall: {
          fontWeight: 600,
          fontSize: "0.7rem",
          height: 22,
        },
      },
    },
  },
});

export default theme;
