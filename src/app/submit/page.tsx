import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import SubmitReportWizard from "@/components/SubmitReportWizard";
import BackButton from "@/components/BackButton";
import RoleGuard from "@/components/RoleGuard";

async function SubmitContent({
  initialProgramId,
  initialDeliverableId,
}: {
  initialProgramId?: string;
  initialDeliverableId?: string;
}) {
  const deliverables = await new MockDeliverableConnector().getDeliverables();

  return (
    <SubmitReportWizard
      deliverables={deliverables}
      initialProgramId={initialProgramId}
      initialDeliverableId={initialDeliverableId}
    />
  );
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string; deliverableId?: string }>;
}) {
  const { programId, deliverableId } = await searchParams;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/">Dashboard</BackButton>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Submit Report</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          Upload a deliverable document to the permanent record
        </Typography>
      </Box>
      <RoleGuard allowedRoles={["drg-admin", "drg-staff"]}>
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <SubmitContent initialProgramId={programId} initialDeliverableId={deliverableId} />
        </Suspense>
      </RoleGuard>
    </Container>
  );
}
