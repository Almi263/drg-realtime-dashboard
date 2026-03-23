"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";

/* ------------------------------------------------------------------ */
/*  Status chip styling (matches RecordsTable)                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Date helpers                                                      */
/* ------------------------------------------------------------------ */

/** Strip time portion — returns midnight-local date for comparison. */
function toDateOnly(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Format a date as e.g. "Wed, Feb 18" */
function formatDueDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Grouping logic                                                    */
/* ------------------------------------------------------------------ */

interface DeliverableGroup {
  key: string;
  label: string;
  items: Deliverable[];
  isOverdue: boolean;
}

function groupDeliverables(deliverables: Deliverable[]): DeliverableGroup[] {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // End of this week: coming Sunday (Feb 22)
  // dayOfWeek: 0=Sun,1=Mon,...,6=Sat. For Monday-based weeks,
  // days until Sunday = (7 - dayOfWeek) % 7, but Sunday itself = 0 so cap at 7.
  const dayOfWeek = todayOnly.getDay(); // 0-6
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfThisWeek = new Date(todayOnly);
  endOfThisWeek.setDate(todayOnly.getDate() + daysUntilSunday);

  // Next week: Monday after this week through the following Sunday
  const startOfNextWeek = new Date(endOfThisWeek);
  startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);

  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  // End of this month
  const endOfMonth = new Date(todayOnly.getFullYear(), todayOnly.getMonth() + 1, 0);

  const overdue: Deliverable[] = [];
  const thisWeek: Deliverable[] = [];
  const nextWeek: Deliverable[] = [];
  const thisMonth: Deliverable[] = [];
  const later: Deliverable[] = [];

  for (const d of deliverables) {
    const due = toDateOnly(d.dueDate);

    if (due < todayOnly) {
      overdue.push(d);
    } else if (due <= endOfThisWeek) {
      thisWeek.push(d);
    } else if (due <= endOfNextWeek) {
      nextWeek.push(d);
    } else if (due <= endOfMonth) {
      thisMonth.push(d);
    } else {
      later.push(d);
    }
  }

  // Sort each group by due date ascending
  const sortByDue = (a: Deliverable, b: Deliverable) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

  overdue.sort(sortByDue);
  thisWeek.sort(sortByDue);
  nextWeek.sort(sortByDue);
  thisMonth.sort(sortByDue);
  later.sort(sortByDue);

  const groups: DeliverableGroup[] = [
    { key: "overdue", label: "Overdue", items: overdue, isOverdue: true },
    { key: "this-week", label: "This Week", items: thisWeek, isOverdue: false },
    { key: "next-week", label: "Next Week", items: nextWeek, isOverdue: false },
    { key: "this-month", label: "This Month", items: thisMonth, isOverdue: false },
    { key: "later", label: "Later", items: later, isOverdue: false },
  ];

  // Filter out empty groups
  return groups.filter((g) => g.items.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Deliverable card                                                  */
/* ------------------------------------------------------------------ */

function DeliverableCard({ deliverable }: { deliverable: Deliverable }) {
  return (
    <Card variant="outlined">
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {/* Row 1: ID + Title */}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {deliverable.id}
          </Typography>
          <Typography variant="subtitle1">{deliverable.title}</Typography>
        </Box>

        {/* Row 2: Type chip, Status chip, Due date, Assigned to */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            mt: 0.25,
          }}
        >
          <Chip
            label={deliverable.type}
            size="small"
            variant="outlined"
            color={deliverable.type === "CDRL" ? "primary" : "secondary"}
          />
          <Chip
            label={deliverable.status}
            size="small"
            {...getStatusChipProps(deliverable.status)}
          />
          <Typography
            variant="body2"
            sx={{
              color: deliverable.status === "Overdue" ? "error.main" : "text.secondary",
              fontWeight: deliverable.status === "Overdue" ? 600 : 400,
            }}
          >
            Due: {formatDueDate(deliverable.dueDate)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", ml: "auto" }}
          >
            {deliverable.assignedTo}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface DeadlinesListProps {
  deliverables: Deliverable[];
}

export default function DeadlinesList({ deliverables }: DeadlinesListProps) {
  // Exclude completed items — the calendar is an action surface, not a history view
  const actionable = deliverables.filter(
    (d) => d.status !== "Submitted" && d.status !== "Approved"
  );
  const groups = useMemo(() => groupDeliverables(actionable), [actionable]);

  if (groups.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          No upcoming deadlines.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      {groups.map((group) => (
        <Box
          key={group.key}
          sx={{
            borderLeft: 4,
            borderColor: group.isOverdue ? "#d32f2f" : "divider",
            pl: 2,
            ...(group.isOverdue && {
              bgcolor: "rgba(211, 47, 47, 0.04)",
              borderRadius: 1,
              py: 1.5,
              pr: 1,
            }),
          }}
        >
          {/* Section header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: group.isOverdue ? "#d32f2f" : "text.primary",
              }}
            >
              {group.label}
            </Typography>
            <Chip
              label={group.items.length}
              size="small"
              sx={{
                fontWeight: 700,
                minWidth: 28,
                bgcolor: group.isOverdue ? "#d32f2f" : "primary.main",
                color: "#fff",
              }}
            />
          </Box>

          {/* Deliverable cards */}
          <Stack spacing={1.5}>
            {group.items.map((d) => (
              <DeliverableCard key={d.id} deliverable={d} />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
