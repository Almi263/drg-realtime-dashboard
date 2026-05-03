"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import ProgramStatusCard from "@/components/ProgramStatusCard";
import StatsSummary from "@/components/StatsSummary";
import { useRole } from "@/lib/context/role-context";
import type { Approval } from "@/lib/models/approval";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument } from "@/lib/models/document";

interface DashboardProgramsViewProps {
  deliverables: Deliverable[];
  documents: DeliverableDocument[];
  approvals: Approval[];
}

export default function DashboardProgramsView({
  deliverables,
  documents,
  approvals,
}: DashboardProgramsViewProps) {
  const { programs, canViewProgram, role } = useRole();
  const visiblePrograms = programs.filter((program) => canViewProgram(program.id));
  const visibleProgramIds = new Set(visiblePrograms.map((program) => program.id));
  const visibleDeliverables = deliverables.filter((deliverable) =>
    visibleProgramIds.has(deliverable.programId)
  );
  const visibleDocuments = documents.filter((document) =>
    visibleProgramIds.has(document.programId)
  );
  const visibleApprovals = approvals.filter((approval) =>
    visibleProgramIds.has(approval.programId)
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <StatsSummary
        deliverables={visibleDeliverables}
        documents={visibleDocuments}
        approvals={visibleApprovals}
        programs={visiblePrograms}
      />

      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontSize: "0.7rem",
          }}
        >
          Active Programs
        </Typography>
        {role === "drg-admin" && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
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
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {visiblePrograms.map((program) => (
              <ProgramStatusCard
                key={program.id}
                program={program}
                deliverables={visibleDeliverables.filter((d) => d.programId === program.id)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
