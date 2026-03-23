"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import DownloadIcon from "@mui/icons-material/Download";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { DeliverableDocument, FileType, AccessAction } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";
import { useRole } from "@/lib/context/role-context";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const FILE_TYPE_COLORS: Record<FileType, string> = {
  Word: "#2b579a",
  PDF: "#d32f2f",
  Excel: "#217346",
  PowerPoint: "#d24726",
};

const ACTION_ICONS: Record<AccessAction, React.ReactNode> = {
  viewed: <VisibilityIcon sx={{ fontSize: "0.9rem" }} />,
  downloaded: <FileDownloadIcon sx={{ fontSize: "0.9rem" }} />,
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(sizeKb: number) {
  return sizeKb >= 1000 ? `${(sizeKb / 1000).toFixed(1)} MB` : `${sizeKb} KB`;
}

/* ------------------------------------------------------------------ */
/*  Access timeline                                                   */
/* ------------------------------------------------------------------ */

function AccessTimeline({ doc }: { doc: DeliverableDocument }) {
  const events = [
    // Treat the upload itself as the first event
    {
      action: "uploaded" as const,
      userName: doc.uploadedBy,
      timestamp: doc.uploadedAt,
      isUpload: true,
    },
    ...doc.accessLog.map((e) => ({ ...e, isUpload: false })),
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Access Log
        </Typography>
        <Chip label={doc.accessLog.length} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
      </Box>

      {events.length === 1 && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No access events yet. This document has not been viewed or downloaded by any external user.
        </Typography>
      )}

      <Box sx={{ position: "relative" }}>
        {/* Vertical line */}
        {events.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              left: 11,
              top: 24,
              bottom: 12,
              width: 2,
              bgcolor: "divider",
            }}
          />
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {events.map((event, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              {/* Timeline dot */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid",
                  borderColor: event.isUpload ? "primary.main" : event.action === "downloaded" ? "success.main" : "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: event.isUpload || event.action === "downloaded" ? "#fff" : "text.secondary",
                  flexShrink: 0,
                  zIndex: 1,
                  bgcolor: event.isUpload ? "primary.main" : event.action === "downloaded" ? "success.main" : "background.paper",
                }}
              >
                {event.isUpload ? (
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 900 }}>UP</Typography>
                ) : (
                  ACTION_ICONS[event.action as AccessAction]
                )}
              </Box>

              {/* Event content */}
              <Box sx={{ flex: 1, pb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event.userName}
                  </Typography>
                  <Chip
                    label={event.isUpload ? "uploaded" : event.action}
                    size="small"
                    variant="outlined"
                    color={
                      event.isUpload ? "primary"
                      : event.action === "downloaded" ? "success"
                      : "default"
                    }
                    sx={{ fontSize: "0.65rem", height: 18 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatDateTime(event.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface DocumentDetailProps {
  doc: DeliverableDocument;
  deliverableTitle: string;
  program: Program | undefined;
}

export default function DocumentDetail({ doc, deliverableTitle, program }: DocumentDetailProps) {
  const { role } = useRole();
  const canSeeAccessLog = role === "drg-admin" || role === "drg-staff";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Document header */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <Chip
                  label={doc.fileType}
                  size="small"
                  sx={{ bgcolor: FILE_TYPE_COLORS[doc.fileType], color: "#fff", fontWeight: 700 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {doc.fileName}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {formatFileSize(doc.sizeKb)}
                {" · "}
                Uploaded by <strong>{doc.uploadedBy}</strong>
                {" · "}
                {formatDateTime(doc.uploadedAt)}
              </Typography>
            </Box>
            <Tooltip title="Download">
              <span>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  disabled
                  size="small"
                >
                  Download
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* Metadata row */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Deliverable</Typography>
              <Chip label={`${doc.deliverableId} — ${deliverableTitle}`} size="small" variant="outlined" sx={{ fontSize: "0.72rem" }} />
            </Box>
            {program && (
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Program</Typography>
                <Chip label={program.name} size="small" variant="outlined" sx={{ fontSize: "0.72rem" }} />
              </Box>
            )}
            <Chip label={doc.status} size="small" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      {/* Immutability notice */}
      <Alert
        icon={<LockIcon fontSize="inherit" />}
        severity="info"
        sx={{ "& .MuiAlert-message": { fontSize: "0.8rem" } }}
      >
        <strong>Permanent record.</strong> This document was submitted on {formatDateTime(doc.uploadedAt)} and cannot be
        modified or deleted by external users. The access log below provides a full audit trail.
        {role === "gov-reviewer" && " Your access to this document has been recorded."}
      </Alert>

      <Divider />

      {/* Access log — staff/admin only */}
      {canSeeAccessLog ? (
        <AccessTimeline doc={doc} />
      ) : (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Access log is visible to DRG staff and administrators only.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
