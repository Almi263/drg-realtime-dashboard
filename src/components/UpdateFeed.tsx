"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { UpdateEvent, UpdateSource, Department } from "@/lib/models/update-event";
import { UPDATE_SOURCES, DEPARTMENTS } from "@/lib/models/update-event";
import UpdateCard from "./UpdateCard";

const SOURCE_LABELS: Record<UpdateSource, string> = {
  teams: "Teams",
  "power-bi": "Power BI",
  "power-automate": "Power Automate",
  dynamics: "Dynamics",
  sharepoint: "SharePoint",
};

export default function UpdateFeed({ events }: { events: UpdateEvent[] }) {
  const [sourceFilter, setSourceFilter] = useState<UpdateSource | "all">("all");
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");

  const filtered = events.filter((e) => {
    if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
    if (deptFilter !== "all" && e.department !== deptFilter) return false;
    return true;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.5 }}>
          Filter by
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={sourceFilter}
            label="Source"
            onChange={(e) => setSourceFilter(e.target.value as UpdateSource | "all")}
          >
            <MenuItem value="all">All sources</MenuItem>
            {UPDATE_SOURCES.map((s) => (
              <MenuItem key={s} value={s}>{SOURCE_LABELS[s]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={deptFilter}
            label="Department"
            onChange={(e) => setDeptFilter(e.target.value as Department | "all")}
          >
            <MenuItem value="all">All departments</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 5 }}>
          No updates match the current filters.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filtered.map((event) => (
            <UpdateCard key={event.id} event={event} />
          ))}
        </Box>
      )}
    </Box>
  );
}
