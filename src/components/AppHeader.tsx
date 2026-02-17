"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";

export default function AppHeader() {
  const [tab, setTab] = useState(0);

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "primary.main" }}>
      <Toolbar
        sx={{
          maxWidth: 960,
          width: "100%",
          mx: "auto",
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
            Update Dashboard
          </Typography>
        </Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            ml: "auto",
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.65)",
              textTransform: "none",
              minWidth: 0,
              fontWeight: 500,
              fontSize: "0.85rem",
              px: 2,
              "&.Mui-selected": { color: "#fff", fontWeight: 600 },
            },
          }}
          TabIndicatorProps={{ sx: { bgcolor: "#fff", height: 2.5 } }}
        >
          <Tab label="Dashboard" />
          <Tab label="Notifications" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
