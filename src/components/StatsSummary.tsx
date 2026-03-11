import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Deliverable } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

interface Props {
  deliverables: Deliverable[];
  programs: Program[];
}

export default function StatsSummary({ deliverables, programs }: Props) {
  const overdue = deliverables.filter((d) => d.status === "Overdue").length;
  const submitted = deliverables.filter((d) => d.status === "Submitted" || d.status === "Approved").length;

  const stats = [
    { value: String(programs.length), label: "Programs" },
    { value: String(deliverables.length), label: "Deliverables" },
    { value: String(overdue), label: "Overdue", alert: overdue > 0 },
    { value: String(submitted), label: "Submitted / Approved" },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
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
