"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessRestrictedNotice from "@/components/AccessRestrictedNotice";
import DocumentsTable from "@/components/DocumentsTable";
import ProgramAccessManager from "@/components/ProgramAccessManager";
import RecordsTable from "@/components/RecordsTable";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument } from "@/lib/models/document";

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
}

export default function ProgramDetailView({
  programId,
  deliverables,
  documents,
}: ProgramDetailViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { getProgramById } = useRole();
  const program = getProgramById(programId);

  if (!program) {
    return (
      <AccessRestrictedNotice title="Program not found" message="This program could not be found in the current workspace." />
    );
  }

  const deliverableMap = Object.fromEntries(deliverables.map((d) => [d.id, d.title]));
  const overdue = deliverables.filter((d) => d.status.startsWith("Overdue")).length;

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {program.name}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
              {program.contractRef}
            </Typography>
          </Box>
          {overdue > 0 && (
            <Chip label={`${overdue} overdue`} sx={{ bgcolor: "error.main", color: "#fff", fontWeight: 700 }} />
          )}
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
            <DocumentsTable documents={documents} deliverableMap={deliverableMap} programs={[program]} />
          )}
          {activeTab === 2 && <ProgramAccessManager program={program} />}
        </Box>
      </Box>
    </Box>
  );
}
