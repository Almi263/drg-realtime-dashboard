import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import FilteredRecordsView from "@/components/FilteredRecordsView";
import { requireUser } from "@/lib/auth/guards";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

async function RecordsContent() {
  const user = await requireUser();
  const [deliverables, programs] = await Promise.all([
    listVisibleDeliverables(user),
    listVisiblePrograms(user),
  ]);
  return <FilteredRecordsView deliverables={deliverables} programs={programs} />;
}

export default function RecordsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Deliverables</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          All CDRL / SDRL Records across active programs
        </Typography>
      </Box>
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
