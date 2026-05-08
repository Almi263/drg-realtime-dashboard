import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import RecordsPageView from "@/components/RecordsPageView";
import { requireUser } from "@/lib/auth/guards";
import { listDeliverableTypes } from "@/lib/dataverse/deliverable-types";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisibleDocuments } from "@/lib/dataverse/documents";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

async function RecordsContent() {
  const user = await requireUser();
  const [deliverables, documents, programs, deliverableTypes] = await Promise.all([
    listVisibleDeliverables(user),
    listVisibleDocuments(user, { currentOnly: false }),
    listVisiblePrograms(user),
    listDeliverableTypes(),
  ]);
  const documentCountsByDeliverableId = documents.reduce<Record<string, number>>(
    (counts, document) => ({
      ...counts,
      [document.deliverableId]: (counts[document.deliverableId] ?? 0) + 1,
    }),
    {}
  );

  return (
    <RecordsPageView
      deliverables={deliverables}
      programs={programs}
      deliverableTypes={deliverableTypes}
      documentCountsByDeliverableId={documentCountsByDeliverableId}
    />
  );
}

export default function RecordsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <RecordsContent />
      </Suspense>
    </Container>
  );
}
