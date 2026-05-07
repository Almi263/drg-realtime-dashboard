"use client";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import NextLink from "next/link";
import Tooltip from "@mui/material/Tooltip";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import type { DeliverableDocument, FileType } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";
import { useRole } from "@/lib/context/role-context";
import { normalizeEmail } from "@/lib/auth/roles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Partial<Record<DeliverableStatus, { bg: string; color: string }>> = {
  Draft: { bg: "#5c6bc0", color: "#fff" },
  "In Review": { bg: "#0078d4", color: "#fff" },
  Returned: { bg: "#ed6c02", color: "#fff" },
  "Pending Acknowledgment": { bg: "#6d4c41", color: "#fff" },
  Complete: { bg: "#2e7d32", color: "#fff" },
  Submitted: { bg: "#00695c", color: "#fff" },
  "Overdue - Waiting on Reviewer": { bg: "#d32f2f", color: "#fff" },
  "Overdue - Waiting on DRG": { bg: "#d32f2f", color: "#fff" },
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
  documentCount?: number;
  program: Program | undefined;
  accessLogCountsByDocumentId?: Record<string, number>;
}

interface AssignedToOption {
  email: string;
  displayName?: string;
}

function getDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return email;

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function DeliverableDetail({
  deliverable: d,
  documents,
  documentCount = documents.length,
  program,
  accessLogCountsByDocumentId = {},
}: DeliverableDetailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isApprovingDraft, setIsApprovingDraft] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(d.title);
  const [editDescription, setEditDescription] = useState(d.description);
  const [editDueDate, setEditDueDate] = useState(d.dueDate.slice(0, 10));
  const [editAssignedToEmail, setEditAssignedToEmail] = useState(
    d.assignedToEmail ?? ""
  );
  const [directoryAssignedToOptions, setDirectoryAssignedToOptions] = useState<
    AssignedToOption[]
  >([]);
  const [assignedToDirectoryName, setAssignedToDirectoryName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    canApproveDeliverableDraftForProgram,
    canCreateDeliverableForProgram,
    canDeleteDeliverableForProgram,
    role,
  } = useRole();
  const canSubmit =
    Boolean(program && program.status !== "Archived") &&
    d.status !== "Draft" &&
    Boolean(
      role &&
        ["drg-admin", "drg-program-owner", "drg-staff", "external-reviewer"].includes(role)
    );
  const canSeeAccessLog =
    role === "drg-admin" || role === "drg-program-owner" || role === "drg-staff";
  const canApproveDraft =
    d.status === "Draft" &&
    Boolean(program && canApproveDeliverableDraftForProgram(program.id));
  const canDelete =
    Boolean(program) &&
    canDeleteDeliverableForProgram(d.programId, documentCount);
  const canEdit =
    Boolean(program) && canCreateDeliverableForProgram(d.programId);
  const assignedToDisplay =
    program?.access.find(
      (entry) =>
        normalizeEmail(entry.email) === normalizeEmail(d.assignedToEmail)
    )?.displayName ??
    assignedToDirectoryName ??
    (d.assignedTo.includes("@") ? getDisplayNameFromEmail(d.assignedTo) : d.assignedTo);
  const assignedToOptions = useMemo(() => {
    const options = new Map<string, AssignedToOption>();

    if (program?.ownerUpn) {
      options.set(normalizeEmail(program.ownerUpn), {
        email: program.ownerUpn,
        displayName: program.ownerName,
      });
    }

    for (const entry of program?.access ?? []) {
      if (!entry.isActive || !entry.email) continue;
      options.set(normalizeEmail(entry.email), {
        email: entry.email,
        displayName: entry.displayName,
      });
    }

    return [...options.values()];
  }, [program]);
  const mergedAssignedToOptions = useMemo(() => {
    const options = new Map<string, AssignedToOption>();

    for (const option of assignedToOptions) {
      options.set(normalizeEmail(option.email), option);
    }

    for (const option of directoryAssignedToOptions) {
      const key = normalizeEmail(option.email);
      const existing = options.get(key);
      options.set(key, {
        ...existing,
        ...option,
        displayName: option.displayName ?? existing?.displayName,
      });
    }

    return [...options.values()];
  }, [assignedToOptions, directoryAssignedToOptions]);

  const statusColors = STATUS_COLORS[d.status];

  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (editAssignedToEmail.trim()) params.set("q", editAssignedToEmail.trim());
        const response = await fetch(`/api/users/program-collaborators?${params}`, {
          signal: controller.signal,
        });
        const json = (await response.json().catch(() => null)) as {
          users?: AssignedToOption[];
        } | null;

        if (!response.ok) {
          setDirectoryAssignedToOptions([]);
          return;
        }

        setDirectoryAssignedToOptions(json?.users ?? []);
      } catch {
        if (!controller.signal.aborted) setDirectoryAssignedToOptions([]);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [editAssignedToEmail, isEditing]);

  useEffect(() => {
    const email = d.assignedToEmail || d.assignedTo;
    if (!email || !email.includes("@")) {
      setAssignedToDirectoryName(null);
      return;
    }

    const controller = new AbortController();

    async function loadAssignedToName() {
      try {
        const params = new URLSearchParams({ q: email });
        const response = await fetch(`/api/users/program-collaborators?${params}`, {
          signal: controller.signal,
        });
        const json = (await response.json().catch(() => null)) as {
          users?: AssignedToOption[];
        } | null;

        if (!response.ok) return;

        const match = json?.users?.find(
          (user) => normalizeEmail(user.email) === normalizeEmail(email)
        );
        setAssignedToDirectoryName(match?.displayName ?? null);
      } catch {
        if (!controller.signal.aborted) setAssignedToDirectoryName(null);
      }
    }

    void loadAssignedToName();

    return () => controller.abort();
  }, [d.assignedTo, d.assignedToEmail]);

  function openEditDialog() {
    setEditTitle(d.title);
    setEditDescription(d.description);
    setEditDueDate(d.dueDate.slice(0, 10));
    setEditAssignedToEmail(d.assignedToEmail ?? "");
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/deliverables/${d.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate,
          assignedToEmail: editAssignedToEmail,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to update deliverable.");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update deliverable.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleApproveDraft() {
    setIsApprovingDraft(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/deliverables/${d.id}/approve-draft`, {
        method: "POST",
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to approve draft.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to approve draft.");
    } finally {
      setIsApprovingDraft(false);
    }
  }

  async function handleDelete() {
    const message =
      documentCount > 0
        ? `Delete ${d.deliverableNumber} and its ${documentCount} document${documentCount === 1 ? "" : "s"}? This cannot be undone.`
        : `Delete ${d.deliverableNumber}? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/deliverables/${d.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to delete deliverable.");
      }

      router.push(program ? `/programs/${program.id}` : "/records");
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete deliverable.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header card */}
      {actionError && <Alert severity="error">{actionError}</Alert>}
      <Card
        variant="outlined"
        sx={{ borderColor: d.status.startsWith("Overdue") ? "error.main" : "divider" }}
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
                  {d.deliverableNumber}
                </Typography>
                <Chip
                  label={d.type}
                  size="small"
                  variant="outlined"
                  color={d.type === "CDRL" ? "primary" : "secondary"}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {d.title}
                </Typography>
                <Chip
                  label={d.status}
                  size="small"
                  sx={statusColors ? { bgcolor: statusColors.bg, color: statusColors.color, fontWeight: 700 } : {}}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              {canEdit && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={openEditDialog}
                >
                  Edit
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            {d.description}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: d.status.startsWith("Overdue") ? "error.main" : "text.secondary" }}>
                Due {formatDate(d.dueDate)}
              </Typography>
            </Box>
            {d.createdOn && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CalendarTodayIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Created on {formatDate(d.createdOn)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <PersonIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {assignedToDisplay}
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

      <Dialog open={isEditing} onClose={() => setIsEditing(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Deliverable Information</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Deliverable name"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Due date"
            type="date"
            value={editDueDate}
            onChange={(event) => setEditDueDate(event.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <Autocomplete
            freeSolo
            options={mergedAssignedToOptions}
            inputValue={editAssignedToEmail}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.displayName || option.email;
            }}
            filterOptions={(options, params) => {
              const query = params.inputValue.trim().toLowerCase();
              if (!query) return options;

              return options.filter((option) =>
                `${option.displayName ?? ""} ${option.email}`
                  .toLowerCase()
                  .includes(query)
              );
            }}
            onChange={(_, value) => {
              if (typeof value === "string") {
                setEditAssignedToEmail(value);
                return;
              }

              setEditAssignedToEmail(value?.email ?? "");
            }}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear") {
                setEditAssignedToEmail(value);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Assigned to" fullWidth />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.email}>
                <Box>
                  <Typography variant="body2">
                    {option.displayName || option.email}
                  </Typography>
                  {option.displayName && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {option.email}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Box>
            {canDelete && (
              <Tooltip
                title={
                  role === "drg-admin" && documentCount > 0
                    ? "DRG admins can delete deliverables even when submitted documents exist."
                    : "Delete deliverable"
                }
              >
                <span>
                  <Button
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    disabled={isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting ? "Deleting..." : "Delete Deliverable"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={isSavingEdit || !editTitle.trim() || !editDueDate}
              onClick={handleSaveEdit}
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {canApproveDraft && (
        <Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={handleApproveDraft}
            disabled={isApprovingDraft}
          >
            {isApprovingDraft ? "Approving..." : "Approve Draft"}
          </Button>
        </Box>
      )}

      {/* Submit action */}
      {canSubmit && d.status !== "Complete" && (
        <Box>
          <Button
            component={NextLink}
            href={`/submit?programId=${encodeURIComponent(d.programId)}&deliverableId=${encodeURIComponent(d.id)}&returnTo=${encodeURIComponent(pathname)}&returnLabel=Deliverable`}
            variant="contained"
            startIcon={<UploadFileIcon />}
            size="small"
          >
            Submit Document for {d.title}
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
            {documents.map((doc) => {
              const accessCount = accessLogCountsByDocumentId[doc.id] ?? 0;

              return (
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
                      {canSeeAccessLog && accessCount > 0 && (
                        <Tooltip title={`${accessCount} access event${accessCount !== 1 ? "s" : ""}`}>
                          <Chip
                            icon={<VisibilityIcon sx={{ fontSize: "0.75rem !important" }} />}
                            label={accessCount}
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
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
