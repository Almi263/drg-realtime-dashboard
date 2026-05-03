import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import DashboardProgramsView from "@/components/DashboardProgramsView";
import { requireUser } from "@/lib/auth/guards";
import { listVisibleApprovals } from "@/lib/dataverse/approvals";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisibleDocuments } from "@/lib/dataverse/documents";

async function DashboardContent() {
  const user = await requireUser();
  const [deliverables, documents, approvals] = await Promise.all([
    listVisibleDeliverables(user),
    listVisibleDocuments(user, { currentOnly: true }),
    listVisibleApprovals(user),
  ]);

  return (
    <DashboardProgramsView
      deliverables={deliverables}
      documents={documents}
      approvals={approvals}
    />
  );
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
