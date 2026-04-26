import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import ProtectedDeliverableDetail from "@/components/ProtectedDeliverableDetail";
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
    <ProtectedDeliverableDetail
      deliverable={deliverable}
      documents={linkedDocs}
      program={program}
    />
  );
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getDeliverableBackConfig(id: string, from: string | string[] | undefined) {
  if (getFirstValue(from) === "records") {
    return {
      href: "/records",
      label: "All Deliverables",
    };
  }

  const deliverables = await new MockDeliverableConnector().getDeliverables();
  const deliverable = deliverables.find((d) => d.id === id);
  if (!deliverable) notFound();
  return {
    href: `/programs/${deliverable.programId}`,
    label: "Program Overview",
  };
}

export default async function RecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const backConfig = await getDeliverableBackConfig(id, from);

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
        <DeliverableDetailContent id={id} />
      </Suspense>
    </Container>
  );
}
