"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
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
import type { Program } from "@/lib/models/program";
import { ROLE_LABELS, useRole } from "@/lib/context/role-context";

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
    accounts,
    role,
    currentUser,
    getProgramAccessList,
    canManageProgramAccess,
    canGrantProgramAccess,
    canRevokeProgramAccess,
    grantProgramAccess,
    revokeProgramAccess,
  } = useRole();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [pendingRevokeEmail, setPendingRevokeEmail] = useState<string | null>(null);

  const accessList = getProgramAccessList(program.id);
  const mayManageAccess = canManageProgramAccess(program.id);

  const grantableAccounts = useMemo(
    () =>
      accounts.filter((account) => canGrantProgramAccess(program.id, account.email)),
    [accounts, canGrantProgramAccess, program.id]
  );

  const pendingRevokeAccount = pendingRevokeEmail
    ? accounts.find((account) => account.email === pendingRevokeEmail) ?? null
    : null;
  const creator = accounts.find((account) => account.email === program.creatorEmail) ?? null;

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
          Program creator: {creator ? `${creator.name} (${creator.email})` : program.creatorEmail}
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
            <Autocomplete
              options={grantableAccounts}
              value={grantableAccounts.find((account) => account.email === selectedEmail) ?? null}
              onChange={(_, value) => setSelectedEmail(value?.email ?? null)}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              filterOptions={(options, state) => {
                const query = state.inputValue.trim().toLowerCase();
                if (!query) return options;
                return options.filter((option) =>
                  `${option.name} ${option.email}`.toLowerCase().includes(query)
                );
              }}
              noOptionsText="No matching accounts"
              sx={{ minWidth: 320, maxWidth: "100%", flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Add account"
                  placeholder="Search by name or email"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {option.email} · {ROLE_LABELS[option.role]}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!selectedEmail}
              onClick={() => {
                if (selectedEmail) {
                  grantProgramAccess(program.id, selectedEmail);
                }
                setSelectedEmail(null);
              }}
            >
              Grant Access
            </Button>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Only DRG admins, program creators, or DRG staff already assigned to this program can manage this access list.
          </Alert>
        )}

        {role === "drg-staff" && mayManageAccess && (
          <Alert severity="info" sx={{ mb: 2 }}>
            As DRG staff, you can add government reviewers and other DRG staff. Only the program creator can revoke other DRG staff.
          </Alert>
        )}

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
                const grantor = accounts.find((account) => account.email === entry.grantedByEmail);
                const mayRevoke = canRevokeProgramAccess(program.id, entry.email);
                return (
                  <TableRow key={entry.email} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {entry.account?.name ?? entry.email}
                      {entry.email === currentUser.email && (
                        <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.75 }}>
                          (You)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.account ? ROLE_LABELS[entry.account.role] : "External"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(entry.grantedAt)}</TableCell>
                    <TableCell>{grantor ? `${grantor.name} (${grantor.email})` : entry.grantedByEmail}</TableCell>
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
              {pendingRevokeAccount ? ` for ${pendingRevokeAccount.name} (${pendingRevokeAccount.email})` : ""}?
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
