import { Suspense } from "react";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import ProgramDetailView from "@/components/ProgramDetailView";
import { assertCanViewProgram, requireUser } from "@/lib/auth/guards";
import { listDeliverableTypes } from "@/lib/dataverse/deliverable-types";
import { listDocumentAccessLogs } from "@/lib/dataverse/document-access-logs";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisibleDocuments } from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";
import type { Program } from "@/lib/models/program";

async function ProgramDetailContent({
  id,
  user,
  program,
}: {
  id: string;
  user: Awaited<ReturnType<typeof requireUser>>;
  program: Program;
}) {
  const includeArchivedPrograms = program.status === "Archived";
  const [deliverables, documents, allDocuments, deliverableTypes] = await Promise.all([
    listVisibleDeliverables(user, { includeArchivedPrograms }),
    listVisibleDocuments(user, { includeArchivedPrograms }),
    listVisibleDocuments(user, {
      includeArchivedPrograms,
      currentOnly: false,
    }),
    listDeliverableTypes(),
  ]);

  const programDeliverables = deliverables.filter((d) => d.programId === id);
  const programDocuments = documents.filter((d) => d.programId === id);
  const documentCountsByDeliverableId = allDocuments
    .filter((document) => document.programId === id)
    .reduce<Record<string, number>>(
      (counts, document) => ({
        ...counts,
        [document.deliverableId]: (counts[document.deliverableId] ?? 0) + 1,
      }),
      {}
    );
  const accessLogMap = await listDocumentAccessLogs(
    programDocuments.map((document) => document.id)
  );
  const accessLogsByDocumentId = Object.fromEntries(accessLogMap);

  return (
    <ProgramDetailView
      programId={id}
      initialProgram={program}
      deliverables={programDeliverables}
      deliverableTypes={deliverableTypes}
      documents={programDocuments}
      documentCountsByDeliverableId={documentCountsByDeliverableId}
      accessLogsByDocumentId={accessLogsByDocumentId}
    />
  );
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const program = await getProgramById(id, user);

  assertCanViewProgram(user, program);
  if (!program) notFound();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href={program.status === "Archived" ? "/programs/archived" : "/programs"}>
        {program.status === "Archived" ? "Archived Programs" : "Active Programs"}
      </BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProgramDetailContent id={id} user={user} program={program} />
      </Suspense>
    </Container>
  );
}
