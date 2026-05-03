import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import ProgramDetailView from "@/components/ProgramDetailView";
import { assertCanViewProgram, requireUser } from "@/lib/auth/guards";
import { listDocumentAccessLogs } from "@/lib/dataverse/document-access-logs";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisibleDocuments } from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";

async function ProgramDetailContent({ id, user }: { id: string; user: Awaited<ReturnType<typeof requireUser>> }) {
  const [deliverables, documents] = await Promise.all([
    listVisibleDeliverables(user),
    listVisibleDocuments(user),
  ]);

  const programDeliverables = deliverables.filter((d) => d.programId === id);
  const programDocuments = documents.filter((d) => d.programId === id);
  const accessLogMap = await listDocumentAccessLogs(
    programDocuments.map((document) => document.id)
  );
  const accessLogsByDocumentId = Object.fromEntries(accessLogMap);

  return (
    <ProgramDetailView
      programId={id}
      deliverables={programDeliverables}
      documents={programDocuments}
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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/programs">All Programs</BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProgramDetailContent id={id} user={user} />
      </Suspense>
    </Container>
  );
}
