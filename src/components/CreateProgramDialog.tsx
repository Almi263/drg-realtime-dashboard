"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

export default function CreateProgramDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Program
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Program</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Program creation is not wired up in this prototype yet. This placeholder keeps the
            dashboard flow intact while the create-program workflow is being implemented.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
