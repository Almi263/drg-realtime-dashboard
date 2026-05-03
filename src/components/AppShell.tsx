"use client";

import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import SidebarNav from "@/components/SidebarNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/signin";

  if (isSignInPage) {
    return <>{children}</>;
  }

  return (
    <>
      <AppHeader />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box
          component="nav"
          sx={{
            width: 240,
            flexShrink: 0,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          }}
        >
          <SidebarNav />
        </Box>
        <Box component="main" sx={{ flex: 1, bgcolor: "background.default", overflow: "auto" }}>
          {children}
        </Box>
      </Box>
    </>
  );
}
