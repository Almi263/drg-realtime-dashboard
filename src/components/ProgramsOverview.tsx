"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import ProgramOwnerAutocomplete, {
  type ProgramOwnerOption,
} from "@/components/ProgramOwnerAutocomplete";
import ProgramStatusCard from "@/components/ProgramStatusCard";
import { useRole } from "@/lib/context/role-context";
import { normalizeEmail } from "@/lib/auth/roles";
import type { Deliverable } from "@/lib/models/deliverable";
import type { Program } from "@/lib/models/program";

interface ProgramsOverviewProps {
  deliverables: Deliverable[];
  programsOverride?: Program[];
  hideCreateProgram?: boolean;
  showSearch?: boolean;
}

export default function ProgramsOverview({
  deliverables,
  programsOverride,
  hideCreateProgram,
  showSearch = false,
}: ProgramsOverviewProps) {
  const router = useRouter();
  const { programs, canManageProgramAccess, canViewProgram, refreshPrograms, role } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editProgramNumber, setEditProgramNumber] = useState("");
  const [editContractRef, setEditContractRef] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSites, setEditSites] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editOwnerUpn, setEditOwnerUpn] = useState("");
  const [ownerInput, setOwnerInput] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<ProgramOwnerOption | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sourcePrograms = programsOverride ?? programs;
  const visiblePrograms = sourcePrograms.filter((program) => canViewProgram(program.id));
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredPrograms = useMemo(() => {
    if (!normalizedSearchQuery) return visiblePrograms;

    return visiblePrograms.filter((program) =>
      [
        program.name,
        program.programNumber,
        program.contractRef,
        program.ownerName ?? "",
        program.ownerUpn,
        program.description,
      ].some((value) => value.toLowerCase().includes(normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, visiblePrograms]);
  const canEditAnyProgram = filteredPrograms.some((program) =>
    canManageProgramAccess(program.id)
  );
  const showToolbar =
    showSearch ||
    canEditAnyProgram ||
    (role === "drg-admin" && !hideCreateProgram);

  function openEditDialog(program: Program) {
    setEditingProgram(program);
    setEditName(program.name);
    setEditProgramNumber(program.programNumber);
    setEditContractRef(program.contractRef);
    setEditDescription(program.description);
    setEditSites(program.sites.map((site) => site.name).join(", "));
    setEditStartDate(program.startDate.slice(0, 10));
    setEditEndDate(program.endDate.slice(0, 10));
    setEditOwnerUpn(program.ownerUpn);
    setSelectedOwner(
      program.ownerUpn
        ? {
            id: program.ownerUpn,
            email: program.ownerUpn,
            displayName: program.ownerName || program.ownerUpn,
          }
        : null
    );
    setOwnerInput(program.ownerName || program.ownerUpn);
    setActionError(null);
  }

  async function handleSaveProgram() {
    if (!editingProgram) return;

    setIsSavingEdit(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/programs/${editingProgram.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          programNumber: editProgramNumber,
          contractRef: editContractRef,
          description: editDescription,
          sites: editSites.split(",").map((site) => site.trim()).filter(Boolean),
          startDate: editStartDate,
          endDate: editEndDate,
          ownerUpn: editOwnerUpn,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to update program.");
      }

      setEditingProgram(null);
      await refreshPrograms();
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update program."
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {actionError && (
        <Typography variant="body2" sx={{ color: "error.main" }}>
          {actionError}
        </Typography>
      )}
      {showToolbar && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          {showSearch && (
            <TextField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search active programs"
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
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
          {(canEditAnyProgram || (role === "drg-admin" && !hideCreateProgram)) && (
            <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              {canEditAnyProgram && (
                <Button
                  variant={isEditMode ? "contained" : "outlined"}
                  color={isEditMode ? "warning" : "primary"}
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditMode((value) => !value)}
                >
                  {isEditMode ? "Editing" : "Edit"}
                </Button>
              )}
              {role === "drg-admin" && !hideCreateProgram && (
              <CreateProgramDialog />
              )}
            </Box>
          )}
        </Box>
      )}

      {filteredPrograms.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {visiblePrograms.length === 0
            ? "No programs are currently assigned to this account."
            : "No programs match the current search."}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {filteredPrograms.map((program) => (
            <ProgramStatusCard
              key={program.id}
              program={program}
              deliverables={deliverables.filter((d) => d.programId === program.id)}
              isEditMode={isEditMode}
              canEdit={canManageProgramAccess(program.id)}
              onEdit={openEditDialog}
            />
          ))}
        </Box>
      )}

      <Dialog
        open={Boolean(editingProgram)}
        onClose={() => {
          if (!isSavingEdit) setEditingProgram(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Program</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
            <TextField
              label="Program name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Program number"
              value={editProgramNumber}
              onChange={(event) => setEditProgramNumber(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Contract reference"
              value={editContractRef}
              onChange={(event) => setEditContractRef(event.target.value)}
              fullWidth
              required
            />
            {role === "drg-admin" && (
              <ProgramOwnerAutocomplete
                value={selectedOwner}
                inputValue={ownerInput}
                required
                onChange={(value) => {
                  setSelectedOwner(value);
                  setEditOwnerUpn(value?.email ?? "");
                }}
                onInputChange={setOwnerInput}
                onError={setActionError}
              />
            )}
            <TextField
              label="Sites"
              placeholder="Norfolk, VA, Tinker AFB, OK"
              value={editSites}
              onChange={(event) => setEditSites(event.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Start date"
                type="date"
                value={editStartDate}
                onChange={(event) => setEditStartDate(event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End date"
                type="date"
                value={editEndDate}
                onChange={(event) => setEditEndDate(event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProgram(null)} disabled={isSavingEdit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              isSavingEdit ||
              !editName.trim() ||
              !editProgramNumber.trim() ||
              !editContractRef.trim() ||
              (role === "drg-admin" && !normalizeEmail(editOwnerUpn))
            }
            onClick={handleSaveProgram}
          >
            {isSavingEdit ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
