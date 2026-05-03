"use client";

import { useState, useMemo } from "react";
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
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import { DELIVERABLE_STATUSES } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

type SortableKey = "id" | "title" | "type" | "status" | "dueDate" | "assignedTo";
type Order = "asc" | "desc";

const STATUS_CHIP_STYLE: Partial<Record<DeliverableStatus, object>> = {
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

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface RecordsTableProps {
  deliverables: Deliverable[];
  programs: Program[];
  detailSource?: "records";
}

export default function RecordsTable({ deliverables, programs, detailSource }: RecordsTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [programFilter, setProgramFilter] = useState<string>("All");
  const [orderBy, setOrderBy] = useState<SortableKey>("dueDate");
  const [order, setOrder] = useState<Order>("asc");

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));
  const deliverableTypes = [...new Set(deliverables.map((d) => d.type))].sort();

  const filtered = useMemo(() => {
    let rows = deliverables;
    if (statusFilter !== "All") rows = rows.filter((d) => d.status === statusFilter);
    if (typeFilter !== "All") rows = rows.filter((d) => d.type === typeFilter);
    if (programFilter !== "All") rows = rows.filter((d) => d.programId === programFilter);
    return rows.slice().sort(getComparator(order, orderBy));
  }, [deliverables, statusFilter, typeFilter, programFilter, order, orderBy]);

  const handleSort = (column: SortableKey) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  // Only show program filter if multiple programs present
  const showProgramFilter = programs.length > 1;

  return (
    <Box>
      {/* Filter controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
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

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                { key: "id" as SortableKey, label: "ID" },
                { key: "title" as SortableKey, label: "Title" },
                { key: "type" as SortableKey, label: "Type" },
                { key: "status" as SortableKey, label: "Status" },
                { key: "dueDate" as SortableKey, label: "Due Date" },
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
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((d) => (
              <TableRow
                key={d.id}
                hover
                onClick={() => router.push(detailSource ? `/records/${d.id}?from=${detailSource}` : `/records/${d.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "primary.main", fontWeight: 600 }}>
                  {d.id}
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
                <TableCell>{d.assignedTo}</TableCell>
                {showProgramFilter && (
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {programMap[d.programId] ?? d.programId}
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={showProgramFilter ? 7 : 6} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
