import { Suspense } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import BackButton from "@/components/BackButton";
import ProgramsOverview from "@/components/ProgramsOverview";
import { requireUser } from "@/lib/auth/guards";
import { listVisibleDeliverables } from "@/lib/dataverse/deliverables";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

async function ArchivedProgramsContent() {
  const user = await requireUser();
  const [programs, deliverables] = await Promise.all([
    listVisiblePrograms(user, { archivedOnly: true }),
    listVisibleDeliverables(user, { includeArchivedPrograms: true }),
  ]);
  const archivedProgramIds = new Set(programs.map((program) => program.id));

  return (
    <ProgramsOverview
      deliverables={deliverables.filter((deliverable) =>
        archivedProgramIds.has(deliverable.programId)
      )}
      programsOverride={programs}
      hideCreateProgram
    />
  );
}

export default function ArchivedProgramsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/programs">Active Programs</BackButton>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5">Archived Programs</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          Read-only program history, document downloads, and audit records
        </Typography>
      </Box>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ArchivedProgramsContent />
      </Suspense>
    </Container>
  );
}
