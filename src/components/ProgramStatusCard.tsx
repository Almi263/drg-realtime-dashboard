"use client";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import type { Program } from "@/lib/models/program";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";

interface ProgramStatusCardProps {
  program: Program;
  deliverables: Deliverable[];
}

const STATUS_COLORS: Partial<Record<DeliverableStatus, { bg: string; color: string }>> = {
  "Overdue - Waiting on Reviewer": { bg: "#d32f2f", color: "#fff" },
  "Overdue - Waiting on DRG": { bg: "#d32f2f", color: "#fff" },
  "In Review": { bg: "#0078d4", color: "#fff" },
  Returned: { bg: "#ed6c02", color: "#fff" },
  "Pending Acknowledgment": { bg: "#6d4c41", color: "#fff" },
  Submitted: { bg: "#00695c", color: "#fff" },
  Complete: { bg: "#2e7d32", color: "#fff" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProgramStatusCard({ program, deliverables }: ProgramStatusCardProps) {
  const counts = deliverables.reduce<Partial<Record<DeliverableStatus, number>>>(
    (acc, d) => ({ ...acc, [d.status]: (acc[d.status] ?? 0) + 1 }),
    {}
  );

  const overdue =
    (counts["Overdue - Waiting on Reviewer"] ?? 0) +
    (counts["Overdue - Waiting on DRG"] ?? 0);
  const lastActivity = deliverables.length
    ? deliverables.reduce((a, b) => (a.lastUpdated > b.lastUpdated ? a : b)).lastUpdated
    : null;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: overdue > 0 ? "error.main" : "divider",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardActionArea component={Link} href={`/programs/${program.id}`} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {program.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.72rem" }}
              >
                {program.contractRef}
              </Typography>
            </Box>
            {overdue > 0 && (
              <Chip
                label={`${overdue} overdue`}
                size="small"
                sx={{ bgcolor: "error.main", color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}
              />
            )}
          </Box>

          {/* Status breakdown */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
            {Object.keys(counts).map((s) => {
              const status = s as DeliverableStatus;
              const count = counts[status];
              if (!count) return null;
              const colors = STATUS_COLORS[status];
              return (
                <Chip
                  key={status}
                  label={`${count} ${status}`}
                  size="small"
                  sx={
                    colors
                      ? { bgcolor: colors.bg, color: colors.color, fontSize: "0.7rem" }
                      : { fontSize: "0.7rem" }
                  }
                />
              );
            })}
          </Box>

          {/* Footer */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {deliverables.length} deliverable{deliverables.length !== 1 ? "s" : ""}
              {" · "}
              {program.sites.length} site{program.sites.length !== 1 ? "s" : ""}
            </Typography>
            {lastActivity && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Updated {formatDate(lastActivity)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
