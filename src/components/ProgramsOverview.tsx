"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import ProgramStatusCard from "@/components/ProgramStatusCard";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

interface ProgramsOverviewProps {
  deliverables: Deliverable[];
  programsOverride?: Program[];
  hideCreateProgram?: boolean;
  showSearch?: boolean;
}

export default function ProgramsOverview({
  deliverables,
  programsOverride,
  hideCreateProgram,
  showSearch = false,
}: ProgramsOverviewProps) {
  const { programs, canViewProgram, role } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const sourcePrograms = programsOverride ?? programs;
  const visiblePrograms = sourcePrograms.filter((program) => canViewProgram(program.id));
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredPrograms = useMemo(() => {
    if (!normalizedSearchQuery) return visiblePrograms;

    return visiblePrograms.filter((program) =>
      [
        program.name,
        program.programNumber,
        program.contractRef,
        program.ownerName ?? "",
        program.ownerUpn,
        program.description,
      ].some((value) => value.toLowerCase().includes(normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, visiblePrograms]);
  const showToolbar = showSearch || (role === "drg-admin" && !hideCreateProgram);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {showToolbar && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          {showSearch && (
            <TextField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search active programs"
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          {role === "drg-admin" && !hideCreateProgram && (
            <Box sx={{ ml: "auto" }}>
              <CreateProgramDialog />
            </Box>
          )}
        </Box>
      )}

      {filteredPrograms.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {visiblePrograms.length === 0
            ? "No programs are currently assigned to this account."
            : "No programs match the current search."}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {filteredPrograms.map((program) => (
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
