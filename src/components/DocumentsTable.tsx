"use client";

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
import type { DeliverableDocument, FileType } from "@/lib/models/document";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

interface DocumentsTableProps {
  documents: DeliverableDocument[];
  deliverableMap: Record<string, string>;
}

const FILE_TYPE_COLORS: Record<FileType, string> = {
  Word: "#2b579a",
  PDF: "#d32f2f",
  Excel: "#217346",
  PowerPoint: "#d24726",
};

function formatFileSize(sizeKb: number): string {
  if (sizeKb >= 1000) {
    return `${(sizeKb / 1000).toFixed(1)} MB`;
  }
  return `${sizeKb} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function DocumentsTable({ documents, deliverableMap }: DocumentsTableProps) {
  return (
    <Box>
      {/* Action buttons (planned SDD functionality) */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="contained" disabled>
          Upload Document
        </Button>
        <Button variant="contained" disabled>
          Attach Document
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Associated Record</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Upload Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell>
                  <Chip
                    label={doc.fileType}
                    size="small"
                    sx={{
                      bgcolor: FILE_TYPE_COLORS[doc.fileType],
                      color: "#fff",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, fontFamily: "monospace" }}
                  >
                    {doc.deliverableId}
                  </Box>
                  {deliverableMap[doc.deliverableId]
                    ? ` — ${deliverableMap[doc.deliverableId]}`
                    : ""}
                </TableCell>
                <TableCell>{doc.uploadedBy}</TableCell>
                <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                <TableCell>{formatFileSize(doc.sizeKb)}</TableCell>
                <TableCell>
                  <Chip label={doc.status} size="small" variant="outlined" />
                </TableCell>
              </TableRow>
            ))}

            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
