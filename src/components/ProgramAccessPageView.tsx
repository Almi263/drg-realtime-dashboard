"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessRestrictedNotice from "@/components/AccessRestrictedNotice";
import ProgramAccessManager from "@/components/ProgramAccessManager";
import { useRole } from "@/lib/context/role-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProgramAccessPageView({ programId }: { programId: string }) {
  const { canViewProgram, getProgramById } = useRole();
  const program = getProgramById(programId);

  if (!program) {
    return (
      <AccessRestrictedNotice
        title="Program not found"
        message="This program could not be found in the current workspace."
      />
    );
  }

  if (!canViewProgram(program.id)) {
    return (
      <AccessRestrictedNotice message="This account does not currently have access to this program." />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 2.5,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {program.name}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
              {program.contractRef}
            </Typography>
          </Box>
          <Chip label="Program Access" variant="outlined" size="small" />
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {program.description}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDate(program.startDate)} - {formatDate(program.endDate)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <LocationOnIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {program.sites.slice(0, 5).join(", ")}
              {program.sites.length > 5 && ` +${program.sites.length - 5} more`}
            </Typography>
          </Box>
        </Box>
      </Box>

      <ProgramAccessManager program={program} />
    </Box>
  );
}
