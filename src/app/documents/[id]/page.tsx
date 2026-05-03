import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import DocumentDetail from "@/components/DocumentDetail";
import { assertCanViewProgram, requireUser } from "@/lib/auth/guards";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { getVisibleDocumentById, listVisibleDocuments } from "@/lib/dataverse/documents";
import { getProgramById, listVisiblePrograms } from "@/lib/dataverse/programs";

async function DocumentDetailContent({ id, user }: { id: string; user: Awaited<ReturnType<typeof requireUser>> }) {
  const [documents, deliverables, programs] = await Promise.all([
    listVisibleDocuments(user),
    listVisibleDeliverables(user),
    listVisiblePrograms(user),
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

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getDocumentBackConfig(
  id: string,
  from: string | string[] | undefined,
  user: Awaited<ReturnType<typeof requireUser>>
) {
  if (getFirstValue(from) === "documents") {
    return {
      href: "/documents",
      label: "All Documents",
    };
  }

  const doc = await getVisibleDocumentById(id, user);
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
  const user = await requireUser();
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const doc = await getVisibleDocumentById(id, user);
  const program = doc ? await getProgramById(doc.programId, user) : undefined;

  assertCanViewProgram(user, program);

  const backConfig = await getDocumentBackConfig(id, from, user);

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
        <DocumentDetailContent id={id} user={user} />
      </Suspense>
    </Container>
  );
}
