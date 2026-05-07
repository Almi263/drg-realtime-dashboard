import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CreateDeliverableDialog from "@/components/CreateDeliverableDialog";
import FilteredRecordsView from "@/components/FilteredRecordsView";
import { requireUser } from "@/lib/auth/guards";
import { listDeliverableTypes } from "@/lib/dataverse/deliverable-types";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

async function RecordsContent() {
  const user = await requireUser();
  const [deliverables, programs, deliverableTypes] = await Promise.all([
    listVisibleDeliverables(user),
    listVisiblePrograms(user),
    listDeliverableTypes(),
  ]);
  return (
    <>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Deliverables</Typography>
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
            All CDRL / SDRL Records across active programs
          </Typography>
          <Box sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}>
            <CreateDeliverableDialog
              programs={programs}
              deliverableTypes={deliverableTypes}
            />
          </Box>
        </Box>
      </Box>
      <FilteredRecordsView
        deliverables={deliverables}
        programs={programs}
      />
    </>
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
