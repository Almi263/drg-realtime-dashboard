import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import DocumentDetail from "@/components/DocumentDetail";
import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";

async function DocumentDetailContent({ id }: { id: string }) {
  const [documents, deliverables, programs] = await Promise.all([
    new MockDocumentConnector().getDocuments(),
    new MockDeliverableConnector().getDeliverables(),
    new MockProgramConnector().getPrograms(),
  ]);

  const doc = documents.find((d) => d.id === id);
  if (!doc) notFound();

  const deliverable = deliverables.find((d) => d.id === doc.deliverableId);
  const program = programs.find((p) => p.id === doc.programId);

  return (
    <DocumentDetail
      doc={doc}
      deliverableTitle={deliverable?.title ?? doc.deliverableId}
      program={program}
    />
  );
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/documents">All Documents</BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <DocumentDetailContent id={id} />
      </Suspense>
    </Container>
  );
}
