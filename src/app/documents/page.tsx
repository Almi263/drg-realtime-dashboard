import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import FilteredDocumentsView from "@/components/FilteredDocumentsView";
import DocumentsUploadButton from "@/components/DocumentsUploadButton";
import { canUploadToProgram, requireUser } from "@/lib/auth/guards";
import { listDocumentAccessLogs } from "@/lib/dataverse/document-access-logs";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisibleDocuments } from "@/lib/dataverse/documents";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

async function DocumentsContent() {
  const user = await requireUser();
  const [documents, deliverables, programs] = await Promise.all([
    listVisibleDocuments(user),
    listVisibleDeliverables(user),
    listVisiblePrograms(user),
  ]);
  const accessLogMap = await listDocumentAccessLogs(
    documents.map((document) => document.id)
  );
  const accessLogsByDocumentId = Object.fromEntries(accessLogMap);
  const canUpload = programs.some((program) => canUploadToProgram(user, program));

  return (
    <>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Documents</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mt: 0.25,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Deliverable submissions and attachments — immutable repository
          </Typography>
          {canUpload && <DocumentsUploadButton />}
        </Box>
      </Box>
      <FilteredDocumentsView
        documents={documents}
        deliverables={deliverables}
        programs={programs}
        accessLogsByDocumentId={accessLogsByDocumentId}
      />
    </>
  );
}

export default function DocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <DocumentsContent />
      </Suspense>
    </Container>
  );
}
