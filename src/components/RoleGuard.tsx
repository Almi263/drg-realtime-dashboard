"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";
import { useRole, ROLE_LABELS, type Role } from "@/lib/context/role-context";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

function AccessDenied({ role }: { role: Role }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        gap: 2,
        color: "text.secondary",
      }}
    >
      <LockIcon sx={{ fontSize: 48, color: "text.disabled" }} />
      <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
        Access restricted
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 360 }}>
        This page is not available for the <strong>{ROLE_LABELS[role]}</strong> role.
        Switch your role in the header to access this section.
      </Typography>
    </Box>
  );
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role } = useRole();
  if (!allowedRoles.includes(role)) {
    return <AccessDenied role={role} />;
  }
  return <>{children}</>;
}
