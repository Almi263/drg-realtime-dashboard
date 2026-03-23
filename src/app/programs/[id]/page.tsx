import { notFound } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BackButton from "@/components/BackButton";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import RecordsTable from "@/components/RecordsTable";
import DocumentsTable from "@/components/DocumentsTable";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function ProgramDetailContent({ id }: { id: string }) {
  const [program, deliverables, documents] = await Promise.all([
    new MockProgramConnector().getProgramById(id),
    new MockDeliverableConnector().getDeliverables(),
    new MockDocumentConnector().getDocuments(),
  ]);

  if (!program) notFound();

  const programDeliverables = deliverables.filter((d) => d.programId === id);
  const programDocuments = documents.filter((d) => d.programId === id);
  const deliverableMap = Object.fromEntries(programDeliverables.map((d) => [d.id, d.title]));

  const overdue = programDeliverables.filter((d) => d.status === "Overdue").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Program header card */}
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: overdue > 0 ? "error.light" : "divider",
          borderRadius: 1,
          p: 2.5,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {program.name}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
              {program.contractRef}
            </Typography>
          </Box>
          {overdue > 0 && (
            <Chip label={`${overdue} overdue`} sx={{ bgcolor: "error.main", color: "#fff", fontWeight: 700 }} />
          )}
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {program.description}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDate(program.startDate)} — {formatDate(program.endDate)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <LocationOnIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {program.sites.slice(0, 5).join(", ")}
              {program.sites.length > 5 && ` +${program.sites.length - 5} more`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Deliverables */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Deliverables
          <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 1, fontWeight: 400 }}>
            ({programDeliverables.length})
          </Typography>
        </Typography>
        <RecordsTable deliverables={programDeliverables} programs={[program]} />
      </Box>

      <Divider />

      {/* Documents */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Documents
          <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 1, fontWeight: 400 }}>
            ({programDocuments.length})
          </Typography>
        </Typography>
        <DocumentsTable documents={programDocuments} deliverableMap={deliverableMap} programs={[program]} />
      </Box>
    </Box>
  );
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href="/programs">All Programs</BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProgramDetailContent id={id} />
      </Suspense>
    </Container>
  );
}
