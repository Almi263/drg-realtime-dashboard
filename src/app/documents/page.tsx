import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import FilteredDocumentsView from "@/components/FilteredDocumentsView";
import { requireUser } from "@/lib/auth/guards";
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
  return <FilteredDocumentsView documents={documents} deliverables={deliverables} programs={programs} />;
}

export default function DocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Documents</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          Deliverable submissions and attachments — immutable repository
        </Typography>
      </Box>
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
