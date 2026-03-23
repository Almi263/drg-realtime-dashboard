import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import ProgramStatusCard from "@/components/ProgramStatusCard";

async function ProgramsContent() {
  const [programs, deliverables] = await Promise.all([
    new MockProgramConnector().getPrograms(),
    new MockDeliverableConnector().getDeliverables(),
  ]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        gap: 2,
      }}
    >
      {programs.map((program) => (
        <ProgramStatusCard
          key={program.id}
          program={program}
          deliverables={deliverables.filter((d) => d.programId === program.id)}
        />
      ))}
    </Box>
  );
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
