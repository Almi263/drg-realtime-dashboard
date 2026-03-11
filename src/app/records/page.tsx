import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import RecordsTable from "@/components/RecordsTable";

async function RecordsContent() {
  const [deliverables, programs] = await Promise.all([
    new MockDeliverableConnector().getDeliverables(),
    new MockProgramConnector().getPrograms(),
  ]);
  return <RecordsTable deliverables={deliverables} programs={programs} />;
}

export default function RecordsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">CDRL / SDRL Records</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          All contract deliverables across active programs
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
