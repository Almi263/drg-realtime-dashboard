"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function AppHeader() {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "primary.main" }}>
      <Toolbar
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 56 },
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: 1.5,
            px: 1.2,
            py: 0.4,
            borderRadius: 1,
            mr: 1.5,
            userSelect: "none",
          }}
          component="span"
        >
          DRG
        </Box>
        <Box sx={{ mr: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, lineHeight: 1.2, color: "#fff", fontSize: "0.9rem" }}
          >
            Delaware Resource Group
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>
            Information Management System
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
