import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import theme from "@/lib/theme";
import AppHeader from "@/components/AppHeader";
import SidebarNav from "@/components/SidebarNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delaware Resource Group — Information Management System",
  description: "CDRL/SDRL deliverable tracking and cross-department visibility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
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
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
