import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import StatsSummary from "@/components/StatsSummary";
import ProgramStatusCard from "@/components/ProgramStatusCard";

async function DashboardContent() {
  const [deliverables, programs] = await Promise.all([
    new MockDeliverableConnector().getDeliverables(),
    new MockProgramConnector().getPrograms(),
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <StatsSummary deliverables={deliverables} programs={programs} />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
          Active Programs
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
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
      </Box>
    </Box>
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
