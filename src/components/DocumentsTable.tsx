"use client";

import { useState, Fragment } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MuiLink from "@mui/material/Link";
import NextLink from "next/link";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { DeliverableDocument, FileType, DocumentAccessAction } from "@/lib/models/document";
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

const ACTION_LABELS: Record<DocumentAccessAction, string> = {
  View: "Viewed",
  Download: "Downloaded",
  Upload: "Uploaded",
  Delete: "Deleted",
  Acknowledge: "Acknowledged",
};

function formatFileSize(sizeKb: number): string {
  return sizeKb >= 1000 ? `${(sizeKb / 1000).toFixed(1)} MB` : `${sizeKb} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  AccessLogRow — expandable panel below a document row             */
/* ------------------------------------------------------------------ */

function AccessLogRow({ doc, colSpan }: { doc: DeliverableDocument; colSpan: number }) {
  if (doc.accessLog.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ py: 1.5, pl: 6, bgcolor: "action.hover" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            No access activity recorded yet.
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow sx={{ bgcolor: "action.hover" }}>
      <TableCell colSpan={colSpan} sx={{ pt: 1, pb: 1.5, pl: 6 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 0.75 }}>
          Access Log
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {doc.accessLog.map((event, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                label={ACTION_LABELS[event.action]}
                size="small"
                variant="outlined"
                color={event.action === "Download" ? "primary" : "default"}
                sx={{ fontSize: "0.65rem", height: 20, minWidth: 80 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {event.userName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatDateTime(event.timestamp)}
              </Typography>
            </Box>
          ))}
        </Box>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface DocumentsTableProps {
  documents: DeliverableDocument[];
  deliverableMap: Record<string, string>;
  programs: Program[];
  detailSource?: "documents";
}

export default function DocumentsTable({ documents, deliverableMap, programs, detailSource }: DocumentsTableProps) {
  const { role } = useRole();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>("All");

  const showProgramFilter = programs.length > 1;
  const canUpload = role === "drg-admin" || role === "drg-staff";
  const canDelete = role === "drg-admin";
  // Access log only visible to internal roles
  const canSeeAccessLog = role === "drg-admin" || role === "drg-staff";

  const filtered = programFilter === "All"
    ? documents
    : documents.filter((d) => d.programId === programFilter);

  // Has to match real column count or the access log row breaks
  const colSpan = 6 + (canSeeAccessLog ? 1 : 0) + (canDelete ? 1 : 0);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Box>
      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        {canUpload && (
          <Tooltip title="Upload — available once Azure Storage is connected">
            <span>
              <Button variant="contained" size="small" disabled>
                Upload Document
              </Button>
            </span>
          </Tooltip>
        )}
        {showProgramFilter && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="doc-program-filter-label">Program</InputLabel>
            <Select
              labelId="doc-program-filter-label"
              value={programFilter}
              label="Program"
              onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}
            >
              <MenuItem value="All">All Programs</MenuItem>
              {programs.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {role === "gov-reviewer" && (
          <Typography variant="caption" sx={{ color: "text.secondary", ml: "auto" }}>
            Read-only access — download only
          </Typography>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {canSeeAccessLog && <TableCell sx={{ width: 40 }} />}
              <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Associated Record</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Upload Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              {canDelete && <TableCell sx={{ width: 48 }} />}
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const accessCount = doc.accessLog.length;

              return (
                <Fragment key={doc.id}>
                  <TableRow hover selected={isExpanded}>
                    {/* Expand toggle (staff/admin only) */}
                    {canSeeAccessLog && (
                      <TableCell padding="none" sx={{ pl: 1 }}>
                        <Tooltip title={isExpanded ? "Hide access log" : `Access log (${accessCount})`}>
                          <IconButton size="small" onClick={() => toggleExpand(doc.id)}>
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <MuiLink
                          component={NextLink}
                          href={detailSource ? `/documents/${doc.id}?from=${detailSource}` : `/documents/${doc.id}`}
                          underline="hover"
                          sx={{ color: "text.primary", fontWeight: 500 }}
                        >
                          {doc.fileName}
                        </MuiLink>
                        {canSeeAccessLog && accessCount > 0 && (
                          <Chip
                            icon={<VisibilityIcon sx={{ fontSize: "0.75rem !important" }} />}
                            label={accessCount}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.65rem", height: 18, cursor: "pointer" }}
                            onClick={() => toggleExpand(doc.id)}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={doc.fileType}
                        size="small"
                        sx={{ bgcolor: FILE_TYPE_COLORS[doc.fileType], color: "#fff" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box component="span" sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {doc.deliverableId}
                      </Box>
                      {deliverableMap[doc.deliverableId] ? ` — ${deliverableMap[doc.deliverableId]}` : ""}
                    </TableCell>

                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>

                    <TableCell>
                      <Chip label={doc.status} size="small" variant="outlined" />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Download — available once Azure Storage is connected">
                          <span>
                            <IconButton size="small" disabled>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Typography variant="caption" sx={{ color: "text.secondary", alignSelf: "center" }}>
                          {formatFileSize(doc.sizeKb)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {canDelete && (
                      <TableCell>
                        <Tooltip title="Delete (admin only)">
                          <IconButton size="small" disabled sx={{ color: "error.light" }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Access log expansion */}
                  {canSeeAccessLog && (
                    <TableRow>
                      <TableCell colSpan={colSpan} sx={{ p: 0, border: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableBody>
                              <AccessLogRow doc={doc} colSpan={colSpan} />
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
