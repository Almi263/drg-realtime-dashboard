"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { normalizeEmail } from "@/lib/auth/roles";
import type { Program } from "@/lib/models/program";
import { useRole } from "@/lib/context/role-context";

function getAccessBadgeLabel(email: string) {
  return email.endsWith("@drgok.com") ? "Internal" : "External";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProgramAccessManager({ program }: { program: Program }) {
  const {
    currentUser,
    getProgramAccessList,
    canManageProgramAccess,
    canGrantProgramAccess,
    canRevokeProgramAccess,
    grantProgramAccess,
    revokeProgramAccess,
  } = useRole();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [pendingRevokeEmail, setPendingRevokeEmail] = useState<string | null>(null);

  const accessList = getProgramAccessList(program.id);
  const mayManageAccess = canManageProgramAccess(program.id);

  async function handleGrantAccess() {
    const email = selectedEmail.trim().toLowerCase();
    if (!email) return;

    setIsSavingAccess(true);
    setAccessError(null);

    try {
      const res = await fetch(`/api/programs/${program.id}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to grant access.");
      }

      grantProgramAccess(program.id, email);
      setSelectedEmail("");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Failed to grant access.");
    } finally {
      setIsSavingAccess(false);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Program Access
          </Typography>
          <Chip label={`${accessList.length} account${accessList.length === 1 ? "" : "s"}`} size="small" />
        </Stack>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Review and manage who can access this program.
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Program creator: {program.creatorEmail}
        </Alert>

        {mayManageAccess ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              mb: 2,
            }}
          >
            <TextField
              size="small"
              label="Invite reviewer by email"
              placeholder="name@example.com"
              value={selectedEmail}
              onChange={(event) => setSelectedEmail(event.target.value)}
              sx={{ minWidth: 320, maxWidth: "100%", flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!canGrantProgramAccess(program.id, selectedEmail) || isSavingAccess}
              onClick={handleGrantAccess}
            >
              {isSavingAccess ? "Sending Invite..." : "Grant Access"}
            </Button>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Only DRG admins or assigned DRG staff can manage this access list.
          </Alert>
        )}

        {accessError && <Alert severity="error" sx={{ mb: 2 }}>{accessError}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Granted</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Granted By</TableCell>
                {mayManageAccess && <TableCell sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {accessList.map((entry) => {
                const mayRevoke = canRevokeProgramAccess(program.id, entry.email);
                return (
                  <TableRow key={entry.email} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {entry.email}
                      {normalizeEmail(entry.email) === normalizeEmail(currentUser?.email) && (
                        <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.75 }}>
                          (You)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getAccessBadgeLabel(entry.email)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(entry.grantedAt)}</TableCell>
                    <TableCell>{entry.grantedByEmail}</TableCell>
                    {mayManageAccess && (
                      <TableCell>
                        <Button
                          color="error"
                          size="small"
                          disabled={!mayRevoke}
                          onClick={() => setPendingRevokeEmail(entry.email)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={Boolean(pendingRevokeEmail)}
          onClose={() => setPendingRevokeEmail(null)}
        >
          <DialogTitle>Revoke program access?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you would like to revoke access
              {pendingRevokeEmail ? ` for ${pendingRevokeEmail}` : ""}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingRevokeEmail(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                if (pendingRevokeEmail) {
                  revokeProgramAccess(program.id, pendingRevokeEmail);
                }
                setPendingRevokeEmail(null);
              }}
            >
              Revoke Access
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
