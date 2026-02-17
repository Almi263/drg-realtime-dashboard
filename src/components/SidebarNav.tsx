"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Records", href: "/records", icon: DescriptionIcon },
  { label: "Calendar", href: "/calendar", icon: CalendarMonthIcon },
  { label: "Documents", href: "/documents", icon: FolderOpenIcon },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <List sx={{ pt: 0 }}>
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={active}
            sx={{
              borderRadius: 0,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": { bgcolor: "primary.main" },
                "& .MuiListItemIcon-root": { color: "#fff" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
