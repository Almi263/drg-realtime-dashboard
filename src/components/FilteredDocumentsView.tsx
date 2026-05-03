"use client";

import Typography from "@mui/material/Typography";
import DocumentsTable from "@/components/DocumentsTable";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument, DocumentAccessLog } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";

interface FilteredDocumentsViewProps {
  documents: DeliverableDocument[];
  deliverables: Deliverable[];
  programs: Program[];
  accessLogsByDocumentId?: Record<string, DocumentAccessLog[]>;
}

export default function FilteredDocumentsView({
  documents,
  deliverables,
  programs,
  accessLogsByDocumentId = {},
}: FilteredDocumentsViewProps) {
  const { canViewProgram } = useRole();
  const visiblePrograms = programs.filter((program) => canViewProgram(program.id));
  const visibleProgramIds = new Set(visiblePrograms.map((program) => program.id));
  const visibleDocuments = documents.filter((document) =>
    visibleProgramIds.has(document.programId)
  );
  const visibleDeliverables = deliverables.filter((deliverable) =>
    visibleProgramIds.has(deliverable.programId)
  );
  const deliverableMap = Object.fromEntries(visibleDeliverables.map((d) => [d.id, d.title]));

  if (visiblePrograms.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No documents are available because this account is not assigned to any programs.
      </Typography>
    );
  }

  return (
    <DocumentsTable
      documents={visibleDocuments}
      deliverableMap={deliverableMap}
      programs={visiblePrograms}
      accessLogsByDocumentId={accessLogsByDocumentId}
      detailSource="documents"
    />
  );
}
