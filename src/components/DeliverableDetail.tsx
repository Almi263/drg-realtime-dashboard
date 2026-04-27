"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import NextLink from "next/link";
import Tooltip from "@mui/material/Tooltip";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import type { DeliverableDocument, FileType } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";
import { useRole } from "@/lib/context/role-context";
import { canRoleViewDeliverableAccessLog, canRoleSubmit } from "@/lib/context/role-access";
/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Partial<Record<DeliverableStatus, { bg: string; color: string }>> = {
  "In Review": { bg: "#0078d4", color: "#fff" },
  Approved: { bg: "#2e7d32", color: "#fff" },
  Submitted: { bg: "#00695c", color: "#fff" },
  Overdue: { bg: "#d32f2f", color: "#fff" },
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  Word: "#2b579a",
  PDF: "#d32f2f",
  Excel: "#217346",
  PowerPoint: "#d24726",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface DeliverableDetailProps {
  deliverable: Deliverable;
  documents: DeliverableDocument[];
  program: Program | undefined;
}

export default function DeliverableDetail({
  deliverable: d,
  documents,
  program,
}: DeliverableDetailProps) {
  const { role } = useRole();
  const canSubmit = canRoleSubmit(role);
  const canViewAccessLog = canRoleViewDeliverableAccessLog(role);

  const statusColors = STATUS_COLORS[d.status];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header card */}
      <Card
        variant="outlined"
        sx={{ borderColor: d.status === "Overdue" ? "error.main" : "divider" }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.secondary", fontSize: "0.85rem" }}
                >
                  {d.id}
                </Typography>
                <Chip
                  label={d.type}
                  size="small"
                  variant="outlined"
                  color={d.type === "CDRL" ? "primary" : "secondary"}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {d.title}
              </Typography>
            </Box>
            <Chip
              label={d.status}
              sx={statusColors ? { bgcolor: statusColors.bg, color: statusColors.color, fontWeight: 700 } : {}}
            />
          </Box>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            {d.description}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: d.status === "Overdue" ? "error.main" : "text.secondary" }}>
                Due {formatDate(d.dueDate)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <PersonIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {d.assignedTo}
              </Typography>
            </Box>
            {program && (
              <MuiLink
                component={NextLink}
                href={`/programs/${program.id}`}
                variant="body2"
                underline="hover"
                sx={{ color: "text.secondary" }}
              >
                {program.name} ({program.contractRef})
              </MuiLink>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Submit action */}
      {canSubmit && d.status !== "Approved" && (
        <Box>
          <Button
            component={NextLink}
            href={`/submit?programId=${d.programId}&deliverableId=${d.id}`}
            variant="contained"
            startIcon={<UploadFileIcon />}
            size="small"
          >
            Submit Document for {d.id}
          </Button>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.75 }}>
            This will open the submission wizard pre-filled for this deliverable.
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Linked documents */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Submitted Documents
          <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 1, fontWeight: 400 }}>
            ({documents.length})
          </Typography>
        </Typography>

        {documents.length === 0 ? (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              py: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No documents submitted yet for this deliverable.
            </Typography>
            {canSubmit && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Use the Submit Document button above to attach a file.
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {documents.map((doc) => (
              <Card key={doc.id} variant="outlined">
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                    "&:last-child": { pb: 1.5 },
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={doc.fileType}
                    size="small"
                    sx={{ bgcolor: FILE_TYPE_COLORS[doc.fileType], color: "#fff", fontSize: "0.7rem", flexShrink: 0 }}
                  />
                  <MuiLink
                    component={NextLink}
                    href={`/documents/${doc.id}`}
                    underline="hover"
                    sx={{ fontWeight: 600, color: "text.primary", flex: 1, minWidth: 0 }}
                  >
                    {doc.fileName}
                  </MuiLink>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {doc.uploadedBy} · {formatDateTime(doc.uploadedAt)}
                    </Typography>
                    <Chip label={doc.status} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                    {canViewAccessLog && doc.accessLog.length > 0 && (
                      <Tooltip title={`${doc.accessLog.length} access event${doc.accessLog.length !== 1 ? "s" : ""}`}>
                        <Chip
                          icon={<VisibilityIcon sx={{ fontSize: "0.75rem !important" }} />}
                          label={doc.accessLog.length}
                          size="small"
                          variant="outlined"
                          component={NextLink}
                          href={`/documents/${doc.id}`}
                          clickable
                          sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
