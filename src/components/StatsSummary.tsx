import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Approval } from "@/lib/models/approval";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";

interface Props {
  deliverables: Deliverable[];
  documents: DeliverableDocument[];
  approvals: Approval[];
  programs: Program[];
}

export default function StatsSummary({
  deliverables,
  documents,
  approvals,
  programs,
}: Props) {
  const overdueDeliverables = deliverables.filter((deliverable) =>
    deliverable.status.startsWith("Overdue")
  ).length;
  const returnedDeliverables = deliverables.filter(
    (deliverable) => deliverable.status === "Returned"
  ).length;
  const currentSubmissions = documents.filter(
    (document) =>
      document.isCurrentVersion && document.documentRole === "DRG Submission"
  ).length;
  const pendingApprovals = approvals.filter(
    (approval) => approval.isCurrent && approval.decision === "Pending"
  ).length;

  const stats = [
    { value: String(programs.length), label: "Active Programs" },
    { value: String(deliverables.length), label: "Deliverables" },
    { value: String(currentSubmissions), label: "Current Submissions" },
    {
      value: String(pendingApprovals),
      label: "Pending Approvals",
      alert: pendingApprovals > 0,
    },
    {
      value: String(returnedDeliverables),
      label: "Returned",
      alert: returnedDeliverables > 0,
    },
    {
      value: String(overdueDeliverables),
      label: "Overdue by Flow Status",
      alert: overdueDeliverables > 0,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          lg: "repeat(6, 1fr)",
        },
        gap: 1.5,
      }}
    >
      {stats.map((s) => (
        <Card key={s.label} variant={s.alert ? "outlined" : "elevation"} sx={s.alert ? { borderColor: "error.main" } : {}}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.35rem",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                color: s.alert ? "error.main" : "primary.main",
              }}
            >
              {s.value}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontWeight: 600,
                fontSize: "0.65rem",
              }}
            >
              {s.label}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
