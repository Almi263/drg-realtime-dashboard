"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRole } from "@/lib/context/role-context";

export default function CreateProgramDialog() {
  const { refreshPrograms, currentUser } = useRole();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [programNumber, setProgramNumber] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [description, setDescription] = useState("");
  const [sites, setSites] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ownerUpn, setOwnerUpn] = useState(currentUser?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          programNumber,
          contractRef,
          description,
          sites: sites.split(",").map((site) => site.trim()).filter(Boolean),
          startDate,
          endDate,
          ownerUpn: ownerUpn || currentUser?.email,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to create program.");
      }

      await refreshPrograms();
      setOpen(false);
      setName("");
      setProgramNumber("");
      setContractRef("");
      setDescription("");
      setSites("");
      setStartDate("");
      setEndDate("");
      setOwnerUpn(currentUser?.email ?? "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create program.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Program
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Program</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Program name" value={name} onChange={(event) => setName(event.target.value)} fullWidth required />
            <TextField label="Program number" value={programNumber} onChange={(event) => setProgramNumber(event.target.value)} fullWidth required />
            <TextField label="Contract reference" value={contractRef} onChange={(event) => setContractRef(event.target.value)} fullWidth required />
            <TextField label="Owner UPN" value={ownerUpn} onChange={(event) => setOwnerUpn(event.target.value)} fullWidth required />
            <TextField label="Sites" placeholder="Norfolk, VA, Tinker AFB, OK" value={sites} onChange={(event) => setSites(event.target.value)} fullWidth />
            <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth multiline minRows={3} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !name.trim() || !programNumber.trim() || !contractRef.trim() || !ownerUpn.trim()}
            onClick={handleCreate}
          >
            {isSaving ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
