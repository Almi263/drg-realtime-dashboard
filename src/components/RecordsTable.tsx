"use client";

import { useState, useMemo } from "react";
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
import type { SelectChangeEvent } from "@mui/material/Select";
import type {
  Deliverable,
  DeliverableStatus,
} from "@/lib/models/deliverable";
import {
  DELIVERABLE_STATUSES,
  DELIVERABLE_TYPES,
} from "@/lib/models/deliverable";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

type SortableKey = "id" | "title" | "type" | "status" | "dueDate" | "assignedTo";
type Order = "asc" | "desc";

const STATUS_CHIP_STYLE: Record<DeliverableStatus, object> = {
  Draft: {},
  "In Review": { bgcolor: "#0078d4", color: "#fff" },
  Approved: { bgcolor: "#2e7d32", color: "#fff" },
  Submitted: { bgcolor: "#00695c", color: "#fff" },
  Overdue: { bgcolor: "#d32f2f", color: "#fff" },
};

function getStatusChipProps(status: DeliverableStatus) {
  if (status === "Draft") {
    return { color: "default" as const };
  }
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
/*  Column definitions                                                */
/* ------------------------------------------------------------------ */

interface ColumnDef {
  key: SortableKey;
  label: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "dueDate", label: "Due Date" },
  { key: "assignedTo", label: "Assigned To" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface RecordsTableProps {
  deliverables: Deliverable[];
}

export default function RecordsTable({ deliverables }: RecordsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [orderBy, setOrderBy] = useState<SortableKey>("dueDate");
  const [order, setOrder] = useState<Order>("asc");

  /* ---------- filter + sort ---------- */

  const filtered = useMemo(() => {
    let rows = deliverables;
    if (statusFilter !== "All") {
      rows = rows.filter((d) => d.status === statusFilter);
    }
    if (typeFilter !== "All") {
      rows = rows.filter((d) => d.type === typeFilter);
    }
    return rows.slice().sort(getComparator(order, orderBy));
  }, [deliverables, statusFilter, typeFilter, order, orderBy]);

  /* ---------- handlers ---------- */

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  const handleTypeChange = (e: SelectChangeEvent) => {
    setTypeFilter(e.target.value);
  };

  const handleSort = (column: SortableKey) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  /* ---------- render ---------- */

  return (
    <Box>
      {/* Filter controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Filter by Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="All">All</MenuItem>
            {DELIVERABLE_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="type-filter-label">Filter by Type</InputLabel>
          <Select
            labelId="type-filter-label"
            value={typeFilter}
            label="Filter by Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="All">All</MenuItem>
            {DELIVERABLE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
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
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>{d.id}</TableCell>
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
                  <Chip
                    label={d.status}
                    size="small"
                    {...getStatusChipProps(d.status)}
                  />
                </TableCell>
                <TableCell
                  sx={d.status === "Overdue" ? { color: "error.main" } : undefined}
                >
                  {formatDate(d.dueDate)}
                </TableCell>
                <TableCell>{d.assignedTo}</TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
