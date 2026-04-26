import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import ProtectedDocumentDetail from "@/components/ProtectedDocumentDetail";
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
    <ProtectedDocumentDetail
      doc={doc}
      deliverableTitle={deliverable?.title ?? doc.deliverableId}
      program={program}
    />
  );
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getDocumentBackConfig(id: string, from: string | string[] | undefined) {
  if (getFirstValue(from) === "documents") {
    return {
      href: "/documents",
      label: "All Documents",
    };
  }

  const documents = await new MockDocumentConnector().getDocuments();
  const doc = documents.find((d) => d.id === id);
  if (!doc) notFound();
  return {
    href: `/records/${doc.deliverableId}`,
    label: "Deliverable Overview",
  };
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const backConfig = await getDocumentBackConfig(id, from);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href={backConfig.href}>{backConfig.label}</BackButton>
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
