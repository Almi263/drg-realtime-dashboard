import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { UpdateEvent, UpdateSource } from "@/lib/models/update-event";

const SOURCE_CONFIG: Record<UpdateSource, { label: string; color: string; textColor?: string }> = {
  teams: { label: "Teams", color: "#6264a7" },
  "power-bi": { label: "Power BI", color: "#f2c811", textColor: "#1a1a1a" },
  "power-automate": { label: "Power Automate", color: "#0066ff" },
  dynamics: { label: "Dynamics", color: "#002050" },
  sharepoint: { label: "SharePoint", color: "#038387" },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function UpdateCard({ event }: { event: UpdateEvent }) {
  const cfg = SOURCE_CONFIG[event.source];

  return (
    <Card>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.color, color: cfg.textColor ?? "#fff" }}
          />
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", textTransform: "capitalize" }}
          >
            {event.department}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
            {timeAgo(event.updatedAt)}
          </Typography>
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 0.25 }}>
          {event.title}
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.55 }}>
          {event.summary}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {event.updatedBy}
          </Typography>
          {event.resourceUrl && (
            <Link
              href={event.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              variant="caption"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontWeight: 600,
                color: "secondary.main",
              }}
            >
              Open <OpenInNewIcon sx={{ fontSize: 13 }} />
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
