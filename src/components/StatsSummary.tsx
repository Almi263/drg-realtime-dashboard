import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Link from "next/link";
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
  const overdueWaitingOnReviewer = deliverables.filter(
    (deliverable) => deliverable.status === "Overdue - Waiting on Reviewer"
  ).length;
  const overdueWaitingOnDrg = deliverables.filter(
    (deliverable) => deliverable.status === "Overdue - Waiting on DRG"
  ).length;
  const returnedDeliverables = deliverables.filter(
    (deliverable) => deliverable.status === "Returned"
  ).length;
  const currentDocuments = documents.filter(
    (document) =>
      document.isCurrentVersion && document.documentRole === "DRG Submission"
  ).length;
  const pendingApprovals = approvals.filter(
    (approval) => approval.isCurrent && approval.decision === "Pending"
  ).length;
  const pendingAcknowledgment = deliverables.filter(
    (deliverable) => deliverable.status === "Pending Acknowledgment"
  ).length;

  const primaryStats = [
    { value: String(programs.length), label: "Active Programs", href: "/programs" },
    { value: String(deliverables.length), label: "Deliverables", href: "/records" },
    { value: String(currentDocuments), label: "Documents", href: "/documents" },
  ];

  const workflowStats = [
    {
      value: String(pendingApprovals),
      label: "Pending Approval",
      href: "/records?status=In+Review",
      alert: pendingApprovals > 0,
    },
    {
      value: String(overdueWaitingOnReviewer),
      label: "Overdue\nWaiting on Reviewer",
      href: "/calendar",
      alert: overdueWaitingOnReviewer > 0,
    },
    {
      value: String(returnedDeliverables),
      label: "Returned",
      href: "/records?status=Returned",
      alert: returnedDeliverables > 0,
    },
    {
      value: String(pendingAcknowledgment),
      label: "Pending Acknowledgment",
      href: "/records?status=Pending+Acknowledgment",
      alert: pendingAcknowledgment > 0,
    },
    {
      value: String(overdueWaitingOnDrg),
      label: "Overdue\nWaiting on DRG",
      href: "/calendar",
      alert: overdueWaitingOnDrg > 0,
    },
  ];

  const renderCard = (s: {
    value: string;
    label: string;
    href: string;
    alert?: boolean;
  }) => (
    <Card key={s.label} variant={s.alert ? "outlined" : "elevation"} sx={s.alert ? { borderColor: "error.main" } : {}}>
      <CardActionArea component={Link} href={s.href} sx={{ height: "100%" }}>
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
              whiteSpace: "pre-line",
            }}
          >
            {s.label}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {primaryStats.map(renderCard)}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {workflowStats.map(renderCard)}
      </Box>
    </Box>
  );
}
