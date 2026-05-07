"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRole } from "@/lib/context/role-context";

interface ProgramOwnerOption {
  id: string;
  email: string;
  displayName: string;
}

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
  const [ownerUpn, setOwnerUpn] = useState("");
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerOptions, setOwnerOptions] = useState<ProgramOwnerOption[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<ProgramOwnerOption | null>(
    null
  );
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoadingOwners(true);

      try {
        const params = new URLSearchParams();
        if (ownerInput.trim()) params.set("q", ownerInput.trim());
        const response = await fetch(`/api/users/program-owners?${params}`, {
          signal: controller.signal,
        });
        const json = (await response.json().catch(() => null)) as {
          users?: ProgramOwnerOption[];
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(json?.error ?? "Failed to load program owners.");
        }

        setOwnerOptions(json?.users ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setOwnerOptions([]);
        setError(
          error instanceof Error ? error.message : "Failed to load program owners."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingOwners(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, ownerInput]);

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
      setOwnerUpn("");
      setOwnerInput("");
      setSelectedOwner(null);
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
            <Autocomplete
              options={ownerOptions}
              value={selectedOwner}
              inputValue={ownerInput}
              loading={isLoadingOwners}
              getOptionLabel={(option) =>
                option.displayName
                  ? `${option.displayName} (${option.email})`
                  : option.email
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setSelectedOwner(value);
                setOwnerUpn(value?.email ?? "");
              }}
              onInputChange={(_, value) => setOwnerInput(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Program owner"
                  helperText="Select a user from the Entra program owners group."
                  fullWidth
                  required
                />
              )}
            />
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
