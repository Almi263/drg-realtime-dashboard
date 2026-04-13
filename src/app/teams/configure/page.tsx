"use client";

import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

type View = {
  id: string;
  label: string;
  path: string;
};

const VIEWS: View[] = [
  { id: "dashboard", label: "Dashboard (overview)", path: "/" },
  { id: "records",   label: "Records (CDRL/SDRL list)", path: "/records" },
  { id: "calendar",  label: "Calendar (deliverable timeline)", path: "/calendar" },
  { id: "documents", label: "Documents", path: "/documents" },
  { id: "submit",    label: "Submit a deliverable", path: "/submit" },
];

export default function TeamsConfigurePage() {
  const [view, setView] = useState<string>("dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    microsoftTeams.app
      .initialize()
      .then(() => {
        if (!mounted) return;
        setReady(true);
        microsoftTeams.pages.config.setValidityState(true);
      })
      .catch((e) => {
        // Outside of Teams (e.g. previewed directly in browser) initialize
        // throws. That's fine for development — the page still renders.
        console.warn("Teams SDK init failed (probably not in Teams):", e);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const choice = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
    const origin = window.location.origin;
    microsoftTeams.pages.config.setConfig({
      entityId: `drgims-${choice.id}`,
      contentUrl: `${origin}${choice.path}`,
      websiteUrl: `${origin}${choice.path}`,
      suggestedDisplayName: `DRG IMS — ${choice.label.split(" ")[0]}`,
    });
  }, [view, ready]);

  return (
    <Box sx={{ p: 3, maxWidth: 480 }}>
      <Typography variant="h6" gutterBottom>
        Add DRG IMS to this channel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pick which view of the Information Management System this tab should
        open to. You can change it later.
      </Typography>
      <FormControl>
        <FormLabel id="view-select-label">View</FormLabel>
        <RadioGroup
          aria-labelledby="view-select-label"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          {VIEWS.map((v) => (
            <FormControlLabel
              key={v.id}
              value={v.id}
              control={<Radio size="small" />}
              label={v.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
