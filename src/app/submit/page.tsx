import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import SubmitReportWizard from "@/components/SubmitReportWizard";
import BackButton from "@/components/BackButton";
import RoleGuard from "@/components/RoleGuard";
import { ROUTE_ALLOWED_ROLES } from "@/lib/context/role-access";

async function SubmitContent({
  initialProgramId,
  initialDeliverableId,
}: {
  initialProgramId?: string;
  initialDeliverableId?: string;
}) {
  const [programs, deliverables] = await Promise.all([
    new MockProgramConnector().getPrograms(),
    new MockDeliverableConnector().getDeliverables(),
  ]);

  return (
    <SubmitReportWizard
      programs={programs}
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
      <RoleGuard allowedRoles={[...ROUTE_ALLOWED_ROLES["/submit"]]}> 
      {/* currently on submit page,  so we can use the ROUTE_ALLOWED_ROLES 
      to get the allowed roles for the submit page */}
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
