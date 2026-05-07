"use client";

import Typography from "@mui/material/Typography";
import CreateDeliverableDialog from "@/components/CreateDeliverableDialog";
import RecordsTable from "@/components/RecordsTable";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable, DeliverableType } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

interface FilteredRecordsViewProps {
  deliverables: Deliverable[];
  programs: Program[];
  deliverableTypes: DeliverableType[];
}

export default function FilteredRecordsView({
  deliverables,
  programs,
  deliverableTypes,
}: FilteredRecordsViewProps) {
  const { canViewProgram } = useRole();
  const visiblePrograms = programs.filter((program) => canViewProgram(program.id));
  const visibleProgramIds = new Set(visiblePrograms.map((program) => program.id));
  const visibleDeliverables = deliverables.filter((deliverable) =>
    visibleProgramIds.has(deliverable.programId)
  );

  if (visiblePrograms.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No records are available because this account is not assigned to any programs.
      </Typography>
    );
  }

  return (
    <RecordsTable
      deliverables={visibleDeliverables}
      programs={visiblePrograms}
      detailSource="records"
      toolbarAction={
        <CreateDeliverableDialog
          programs={visiblePrograms}
          deliverableTypes={deliverableTypes}
        />
      }
    />
  );
}
