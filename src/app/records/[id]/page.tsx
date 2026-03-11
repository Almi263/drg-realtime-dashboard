import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import DeliverableDetail from "@/components/DeliverableDetail";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";

async function DeliverableDetailContent({ id }: { id: string }) {
  const [deliverables, documents, programs] = await Promise.all([
    new MockDeliverableConnector().getDeliverables(),
    new MockDocumentConnector().getDocuments(),
    new MockProgramConnector().getPrograms(),
  ]);

  const deliverable = deliverables.find((d) => d.id === id);
  if (!deliverable) notFound();

  const linkedDocs = documents.filter((doc) => doc.deliverableId === id);
  const program = programs.find((p) => p.id === deliverable.programId);

  return (
    <DeliverableDetail
      deliverable={deliverable}
      documents={linkedDocs}
      program={program}
    />
  );
}

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/records">All Records</BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <DeliverableDetailContent id={id} />
      </Suspense>
    </Container>
  );
}
