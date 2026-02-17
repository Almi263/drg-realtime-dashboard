import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { UpdateEvent } from "@/lib/models/update-event";

interface Props {
  events: UpdateEvent[];
}

export default function StatsSummary({ events }: Props) {
  const uniqueSources = new Set(events.map((e) => e.source)).size;
  const uniqueDepts = new Set(events.map((e) => e.department)).size;

  const latest = events.length
    ? events.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
    : null;

  const latestLabel = latest
    ? new Date(latest.updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "\u2014";

  const stats = [
    { value: String(events.length), label: "Updates" },
    { value: String(uniqueSources), label: "Sources" },
    { value: String(uniqueDepts), label: "Departments" },
    { value: latestLabel, label: "Latest" },
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
        <Card key={s.label}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: s.label === "Latest" ? "0.95rem" : "1.35rem",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                color: "primary.main",
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
