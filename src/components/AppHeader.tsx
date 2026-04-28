"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { useRole, ROLE_LABELS } from "@/lib/context/role-context";

export default function AppHeader() {
  const { role, currentUser } = useRole();

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
        <Box
          sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <Box
            component="img"
            src="/DRG-logo-horizontal.avif"
            alt="Delaware Resource Group"
            sx={{ width: "auto", height: 36, display: "block" }}
          />
        </Box>

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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {currentUser ? (
            <>
              <Chip
                label={`${currentUser.email}${role ? ` · ${ROLE_LABELS[role]}` : ""}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  height: 24,
                }}
              />
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
