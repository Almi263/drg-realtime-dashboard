"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessRestrictedNotice from "@/components/AccessRestrictedNotice";
import DocumentsTable from "@/components/DocumentsTable";
import ProgramAccessManager from "@/components/ProgramAccessManager";
import RecordsTable from "@/components/RecordsTable";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument, DocumentAccessLog } from "@/lib/models/document";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ProgramDetailViewProps {
  programId: string;
  deliverables: Deliverable[];
  documents: DeliverableDocument[];
  accessLogsByDocumentId?: Record<string, DocumentAccessLog[]>;
}

export default function ProgramDetailView({
  programId,
  deliverables,
  documents,
  accessLogsByDocumentId = {},
}: ProgramDetailViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();
  const { getProgramById, refreshPrograms, role } = useRole();
  const program = getProgramById(programId);

  if (!program) {
    return (
      <AccessRestrictedNotice title="Program not found" message="This program could not be found in the current workspace." />
    );
  }

  const deliverableMap = Object.fromEntries(deliverables.map((d) => [d.id, d.title]));
  const overdue = deliverables.filter((d) => d.status.startsWith("Overdue")).length;
  const mayDeleteProgram = role === "drg-admin";

  async function handleDeleteProgram() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to delete program.");
      }

      await refreshPrograms();
      setIsDeleteDialogOpen(false);
      router.push("/programs");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete program."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: overdue > 0 ? "error.light" : "divider",
          borderRadius: 1,
          p: 2.5,
        }}
      >
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {program.name}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
              {program.contractRef}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {overdue > 0 && (
              <Chip label={`${overdue} overdue`} sx={{ bgcolor: "error.main", color: "#fff", fontWeight: 700 }} />
            )}
            {mayDeleteProgram && (
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => {
                  setDeleteError(null);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {program.description}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatDate(program.startDate)} - {formatDate(program.endDate)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <LocationOnIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {program.sites.slice(0, 5).map((site) => site.name).join(", ")}
              {program.sites.length > 5 && ` +${program.sites.length - 5} more`}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, nextValue: number) => setActiveTab(nextValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 2,
            pt: 1,
          }}
        >
          <Tab label={`Deliverables (${deliverables.length})`} />
          <Tab label={`Documents (${documents.length})`} />
          <Tab label="Program Access" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {activeTab === 0 && <RecordsTable deliverables={deliverables} programs={[program]} />}
          {activeTab === 1 && (
            <DocumentsTable
              documents={documents}
              deliverableMap={deliverableMap}
              programs={[program]}
              accessLogsByDocumentId={accessLogsByDocumentId}
            />
          )}
          {activeTab === 2 && <ProgramAccessManager program={program} />}
        </Box>
      </Box>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Program?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes the program only if it is still empty test
            data. Programs with deliverables, documents, approvals, or audit
            logs will be kept.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteProgram}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
