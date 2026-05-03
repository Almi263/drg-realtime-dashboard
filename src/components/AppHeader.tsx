"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { signIn, signOut } from "next-auth/react";
import { SignInButton } from "@/components/AuthButtons";
import { useRole, ROLE_LABELS } from "@/lib/context/role-context";

export default function AppHeader() {
  const { role, currentUser } = useRole();
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | null>(null);
  const isAccountMenuOpen = Boolean(accountMenuAnchor);

  async function handleSwitchAccount() {
    setAccountMenuAnchor(null);
    await signOut({ redirect: false });
    await signIn(
      "microsoft-entra-id",
      { callbackUrl: "/" },
      { prompt: "select_account" },
    );
  }

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
                onClick={(event) => setAccountMenuAnchor(event.currentTarget)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  height: 24,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.24)",
                  },
                }}
              />
              <Menu
                anchorEl={accountMenuAnchor}
                open={isAccountMenuOpen}
                onClose={() => setAccountMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem disabled sx={{ opacity: "1 !important" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {currentUser.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentUser.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSwitchAccount}>Sign in with a different account</MenuItem>
                <MenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <SignInButton />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
