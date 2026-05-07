"use client";

import { useState, useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import { DELIVERABLE_STATUSES } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";
import { useRole } from "@/lib/context/role-context";
import { normalizeEmail } from "@/lib/auth/roles";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

type SortableKey =
  | "deliverableNumber"
  | "title"
  | "type"
  | "status"
  | "dueDate"
  | "createdOn"
  | "assignedTo";
type Order = "asc" | "desc";

const STATUS_CHIP_STYLE: Partial<Record<DeliverableStatus, object>> = {
  Draft: { bgcolor: "#5c6bc0", color: "#fff" },
  "Not Submitted": {},
  "In Review": { bgcolor: "#0078d4", color: "#fff" },
  Returned: { bgcolor: "#ed6c02", color: "#fff" },
  "Pending Acknowledgment": { bgcolor: "#6d4c41", color: "#fff" },
  Complete: { bgcolor: "#2e7d32", color: "#fff" },
  Submitted: { bgcolor: "#00695c", color: "#fff" },
  "Overdue - Waiting on Reviewer": { bgcolor: "#d32f2f", color: "#fff" },
  "Overdue - Waiting on DRG": { bgcolor: "#d32f2f", color: "#fff" },
};

function getStatusChipProps(status: DeliverableStatus) {
  if (status === "Not Submitted") return { color: "default" as const };
  return { sx: STATUS_CHIP_STYLE[status] };
}

function descendingComparator(a: Deliverable, b: Deliverable, key: SortableKey): number {
  const aVal = a[key];
  const bVal = b[key];
  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

function getComparator(order: Order, orderBy: SortableKey) {
  return order === "desc"
    ? (a: Deliverable, b: Deliverable) => descendingComparator(a, b, orderBy)
    : (a: Deliverable, b: Deliverable) => -descendingComparator(a, b, orderBy);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function getAssignedToDisplay(deliverable: Deliverable, programs: Program[]) {
  const program = programs.find((entry) => entry.id === deliverable.programId);
  return (
    program?.access.find(
      (entry) =>
        normalizeEmail(entry.email) === normalizeEmail(deliverable.assignedToEmail)
    )?.displayName ?? deliverable.assignedTo
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface RecordsTableProps {
  deliverables: Deliverable[];
  programs: Program[];
  detailSource?: "records";
  toolbarAction?: ReactNode;
  showSearch?: boolean;
  documentCountsByDeliverableId?: Record<string, number>;
}

export default function RecordsTable({
  deliverables,
  programs,
  detailSource,
  toolbarAction,
  showSearch = false,
  documentCountsByDeliverableId = {},
}: RecordsTableProps) {
  const router = useRouter();
  const { canDeleteDeliverableForProgram, role } = useRole();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [programFilter, setProgramFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState<SortableKey>("dueDate");
  const [order, setOrder] = useState<Order>("asc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const programMap = useMemo(
    () => Object.fromEntries(programs.map((p) => [p.id, p.name])),
    [programs]
  );
  const deliverableTypes = useMemo(
    () => [...new Set(deliverables.map((d) => d.type))].sort(),
    [deliverables]
  );

  const filtered = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    let rows = deliverables;
    if (statusFilter !== "All") rows = rows.filter((d) => d.status === statusFilter);
    if (typeFilter !== "All") rows = rows.filter((d) => d.type === typeFilter);
    if (programFilter !== "All") rows = rows.filter((d) => d.programId === programFilter);
    if (normalizedSearchQuery) {
      rows = rows.filter((d) =>
        [
          d.deliverableNumber,
          d.title,
          d.type,
          d.status,
          getAssignedToDisplay(d, programs),
          programMap[d.programId] ?? d.programId,
        ].some((value) => value.toLowerCase().includes(normalizedSearchQuery))
      );
    }
    return rows.slice().sort(getComparator(order, orderBy));
  }, [deliverables, statusFilter, typeFilter, programFilter, searchQuery, order, orderBy, programMap, programs]);

  const handleSort = (column: SortableKey) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  async function handleDelete(event: MouseEvent, deliverable: Deliverable) {
    event.stopPropagation();
    const documentCount = documentCountsByDeliverableId[deliverable.id] ?? 0;
    const message =
      documentCount > 0
        ? `Delete ${deliverable.deliverableNumber} and its ${documentCount} document${documentCount === 1 ? "" : "s"}? This cannot be undone.`
        : `Delete ${deliverable.deliverableNumber}? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setDeletingId(deliverable.id);
    setActionError(null);

    try {
      const response = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to delete deliverable.");
      }

      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete deliverable."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Only show program filter if multiple programs present
  const showProgramFilter = programs.length > 1;
  const showActions = filtered.some((deliverable) =>
    canDeleteDeliverableForProgram(
      deliverable.programId,
      documentCountsByDeliverableId[deliverable.id] ?? 0
    )
  );

  return (
    <Box>
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {/* Filter controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {showProgramFilter && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="program-filter-label">Program</InputLabel>
              <Select
                labelId="program-filter-label"
                value={programFilter}
                label="Program"
                onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}
              >
                <MenuItem value="All">All Programs</MenuItem>
                {programs.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              {DELIVERABLE_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="type-filter-label">Type</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Type"
              onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="All">All Types</MenuItem>
              {deliverableTypes.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {(showSearch || toolbarAction) && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", ml: "auto", flexWrap: "wrap" }}>
            {showSearch && (
              <TextField
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search deliverables"
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 280 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
            {toolbarAction}
          </Box>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                { key: "deliverableNumber" as SortableKey, label: "Deliverable Number" },
                { key: "title" as SortableKey, label: "Title" },
                { key: "type" as SortableKey, label: "Type" },
                { key: "status" as SortableKey, label: "Status" },
                { key: "dueDate" as SortableKey, label: "Due Date" },
                { key: "createdOn" as SortableKey, label: "Created On" },
                { key: "assignedTo" as SortableKey, label: "Assigned To" },
              ].map((col) => (
                <TableCell key={col.key} sortDirection={orderBy === col.key ? order : false}>
                  <TableSortLabel
                    active={orderBy === col.key}
                    direction={orderBy === col.key ? order : "asc"}
                    onClick={() => handleSort(col.key)}
                    sx={{ fontWeight: 700 }}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {showProgramFilter && <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>}
              {showActions && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((d) => {
              const documentCount = documentCountsByDeliverableId[d.id] ?? 0;
              const canDelete = canDeleteDeliverableForProgram(d.programId, documentCount);
              const deleteTooltip =
                role === "drg-program-owner" && documentCount > 0
                  ? "Program owners can only delete deliverables with no documents"
                  : "Delete deliverable";

              const assignedToDisplay = getAssignedToDisplay(d, programs);

              return (
                <TableRow
                  key={d.id}
                  hover
                  onClick={() => router.push(detailSource ? `/records/${d.id}?from=${detailSource}` : `/records/${d.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "primary.main", fontWeight: 600 }}>
                    {d.deliverableNumber}
                  </TableCell>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.type}
                      size="small"
                      variant="outlined"
                      color={d.type === "CDRL" ? "primary" : "secondary"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={d.status} size="small" {...getStatusChipProps(d.status)} />
                  </TableCell>
                  <TableCell sx={d.status.startsWith("Overdue") ? { color: "error.main" } : undefined}>
                    {formatDate(d.dueDate)}
                  </TableCell>
                  <TableCell>{d.createdOn ? formatDate(d.createdOn) : "—"}</TableCell>
                  <TableCell>{assignedToDisplay}</TableCell>
                  {showProgramFilter && (
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {programMap[d.programId] ?? d.programId}
                      </Typography>
                    </TableCell>
                  )}
                  {showActions && (
                    <TableCell align="right">
                      {canDelete && (
                        <Tooltip title={deleteTooltip}>
                          <span>
                            <IconButton
                              aria-label={`Delete ${d.deliverableNumber}`}
                              color="error"
                              size="small"
                              onClick={(event) => handleDelete(event, d)}
                              disabled={deletingId === d.id}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7 + (showProgramFilter ? 1 : 0) + (showActions ? 1 : 0)}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No records match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
