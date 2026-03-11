"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import PersonIcon from "@mui/icons-material/Person";
import { useRole, ROLES, ROLE_LABELS, type Role } from "@/lib/context/role-context";

const ROLE_CHIP_COLORS: Record<Role, string> = {
  "drg-admin": "rgba(255,255,255,0.18)",
  "drg-staff": "rgba(255,255,255,0.18)",
  "gov-reviewer": "rgba(255,193,7,0.25)",
};

export default function AppHeader() {
  const { role, setRole } = useRole();

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "primary.main" }}>
      <Toolbar
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 56 },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {/* Wordmark */}
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
            userSelect: "none",
            flexShrink: 0,
          }}
          component="span"
        >
          DRG
        </Box>

        {/* App name */}
        <Box sx={{ mr: "auto" }}>
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

        {/* Role switcher */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }} />
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
            Viewing as
          </Typography>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            size="small"
            variant="outlined"
            renderValue={(v) => (
              <Chip
                label={ROLE_LABELS[v as Role]}
                size="small"
                sx={{
                  bgcolor: ROLE_CHIP_COLORS[v as Role],
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  height: 22,
                  cursor: "pointer",
                }}
              />
            )}
            sx={{
              color: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
              "& .MuiSelect-select": { p: "2px 28px 2px 4px !important" },
              minWidth: 130,
            }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
