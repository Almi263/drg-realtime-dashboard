import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import ProgramsOverview from "@/components/ProgramsOverview";

async function ProgramsContent() {
  const deliverables = await new MockDeliverableConnector().getDeliverables();

  return <ProgramsOverview deliverables={deliverables} />;
}

export default function ProgramsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Programs</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          All active contracts and programs managed by DRG
        </Typography>
      </Box>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProgramsContent />
      </Suspense>
    </Container>
  );
}
