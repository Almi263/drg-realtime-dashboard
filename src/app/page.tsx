import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import DashboardProgramsView from "@/components/DashboardProgramsView";

async function DashboardContent() {
  const deliverables = await new MockDeliverableConnector().getDeliverables();

  return <DashboardProgramsView deliverables={deliverables} />;
}

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          CDRL/SDRL deliverable status across all active programs
        </Typography>
      </Box>
      <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
        <DashboardContent />
      </Suspense>
    </Container>
  );
}
