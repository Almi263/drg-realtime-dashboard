"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import ProgramStatusCard from "@/components/ProgramStatusCard";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

interface ProgramsOverviewProps {
  deliverables: Deliverable[];
  programsOverride?: Program[];
  hideCreateProgram?: boolean;
}

export default function ProgramsOverview({
  deliverables,
  programsOverride,
  hideCreateProgram,
}: ProgramsOverviewProps) {
  const { programs, canViewProgram, role } = useRole();
  const sourcePrograms = programsOverride ?? programs;
  const visiblePrograms = sourcePrograms.filter((program) => canViewProgram(program.id));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {role === "drg-admin" && !hideCreateProgram && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <CreateProgramDialog />
        </Box>
      )}

      {visiblePrograms.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No programs are currently assigned to this account.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {visiblePrograms.map((program) => (
            <ProgramStatusCard
              key={program.id}
              program={program}
              deliverables={deliverables.filter((d) => d.programId === program.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
