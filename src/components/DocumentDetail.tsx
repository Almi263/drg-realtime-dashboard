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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type {
  DeliverableDocument,
  DocumentAccessAction,
  DocumentAccessLog,
  FileType,
} from "@/lib/models/document";
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

const ACTION_ICONS: Record<DocumentAccessAction, React.ReactNode> = {
  View: <VisibilityIcon sx={{ fontSize: "0.9rem" }} />,
  Download: <FileDownloadIcon sx={{ fontSize: "0.9rem" }} />,
  Upload: <UploadFileIcon sx={{ fontSize: "0.9rem" }} />,
  Delete: <VisibilityIcon sx={{ fontSize: "0.9rem" }} />,
  Acknowledge: <VisibilityIcon sx={{ fontSize: "0.9rem" }} />,
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

function AccessTimeline({ logs }: { logs: DocumentAccessLog[] }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Access Log
        </Typography>
        <Chip label={logs.length} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
      </Box>

      {logs.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No access activity recorded yet.
        </Typography>
      )}

      <Box sx={{ position: "relative" }}>
        {/* Vertical line */}
        {logs.length > 1 && (
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
          {logs.map((event) => (
            <Box key={event.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              {/* Timeline dot */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid",
                  borderColor: event.action === "Upload" ? "primary.main" : event.action === "Download" ? "success.main" : "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: event.action === "Upload" || event.action === "Download" ? "#fff" : "text.secondary",
                  flexShrink: 0,
                  zIndex: 1,
                  bgcolor: event.action === "Upload" ? "primary.main" : event.action === "Download" ? "success.main" : "background.paper",
                }}
              >
                {ACTION_ICONS[event.action]}
              </Box>

              {/* Event content */}
              <Box sx={{ flex: 1, pb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event.actorName || event.actorEmail}
                  </Typography>
                  <Chip
                    label={event.action}
                    size="small"
                    variant="outlined"
                    color={
                      event.action === "Upload" ? "primary"
                      : event.action === "Download" ? "success"
                      : "default"
                    }
                    sx={{ fontSize: "0.65rem", height: 18 }}
                  />
                  {event.source && (
                    <Chip
                      label={event.source}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.65rem", height: 18 }}
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatDateTime(event.occurredOn)}
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
  accessLogs?: DocumentAccessLog[];
}

export default function DocumentDetail({
  doc,
  deliverableTitle,
  program,
  accessLogs = [],
}: DocumentDetailProps) {
  const { role } = useRole();
  const canSeeAccessLog =
    role === "drg-admin" || role === "drg-program-owner" || role === "drg-staff";

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
              <Button
                component="a"
                href={`/api/documents/${doc.id}/download`}
                variant="contained"
                startIcon={<DownloadIcon />}
                size="small"
              >
                Download
              </Button>
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
        <AccessTimeline logs={accessLogs} />
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
