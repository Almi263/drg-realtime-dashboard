import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import ProgramDetailView from "@/components/ProgramDetailView";

async function ProgramDetailContent({ id }: { id: string }) {
  const [deliverables, documents] = await Promise.all([
    new MockDeliverableConnector().getDeliverables(),
    new MockDocumentConnector().getDocuments(),
  ]);

  const programDeliverables = deliverables.filter((d) => d.programId === id);
  const programDocuments = documents.filter((d) => d.programId === id);
  return <ProgramDetailView programId={id} deliverables={programDeliverables} documents={programDocuments} />;
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        <ProgramDetailContent id={id} />
      </Suspense>
    </Container>
  );
}
