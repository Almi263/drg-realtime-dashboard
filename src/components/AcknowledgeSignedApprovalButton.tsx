"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

interface AcknowledgeSignedApprovalButtonProps {
  approvalId: string;
  acceptedSubmissionDocumentId: string;
  signedApprovalDocumentId: string;
  onAcknowledged?: () => void;
}

export default function AcknowledgeSignedApprovalButton({
  approvalId,
  acceptedSubmissionDocumentId,
  signedApprovalDocumentId,
  onAcknowledged,
}: AcknowledgeSignedApprovalButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAcknowledge() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acceptedSubmissionDocumentId,
          signedApprovalDocumentId,
        }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to acknowledge signed approval.");
      }

      setMessage(
        json?.flowSkipped
          ? "Acknowledgment accepted. Configure the instant flow URL to run automation."
          : "Signed approval acknowledged."
      );
      onAcknowledged?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to acknowledge signed approval."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Button
        variant="contained"
        size="small"
        disabled={isSaving || !signedApprovalDocumentId}
        onClick={handleAcknowledge}
      >
        {isSaving ? "Acknowledging..." : "Acknowledge Signed Approval"}
      </Button>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}
