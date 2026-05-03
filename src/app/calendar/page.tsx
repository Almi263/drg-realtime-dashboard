import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { requireUser } from "@/lib/auth/guards";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import DeadlinesList from "@/components/DeadlinesList";

async function CalendarContent() {
  const user = await requireUser();
  const visibleDeliverables = await listVisibleDeliverables(user);

  return <DeadlinesList deliverables={visibleDeliverables} />;
}

export default function CalendarPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Deliverable Calendar</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          Upcoming deadlines and submission dates
        </Typography>
      </Box>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <CalendarContent />
      </Suspense>
    </Container>
  );
}
