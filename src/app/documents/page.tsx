import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import DocumentsTable from "@/components/DocumentsTable";

async function DocumentsContent() {
  const [documents, deliverables] = await Promise.all([
    new MockDocumentConnector().getDocuments(),
    new MockDeliverableConnector().getDeliverables(),
  ]);
  const deliverableMap = Object.fromEntries(
    deliverables.map((d) => [d.id, d.title])
  );
  return <DocumentsTable documents={documents} deliverableMap={deliverableMap} />;
}

export default function DocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Documents</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          Deliverable documents and attachments
        </Typography>
      </Box>
      <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
        <DocumentsContent />
      </Suspense>
    </Container>
  );
}
