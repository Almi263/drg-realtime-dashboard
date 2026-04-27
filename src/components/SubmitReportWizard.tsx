"use client";

import { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import type { Program } from "@/lib/models/program";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const STEPS = ["Select Program", "Select Deliverable", "Attach Document", "Submitted"];

const STATUS_CHIP_STYLE: Partial<Record<DeliverableStatus, object>> = {
  "In Review": { bgcolor: "#0078d4", color: "#fff" },
  Approved: { bgcolor: "#2e7d32", color: "#fff" },
  Submitted: { bgcolor: "#00695c", color: "#fff" },
  Overdue: { bgcolor: "#d32f2f", color: "#fff" },
};

// Fake ref, server would return a real one after persisting
function genSubmissionRef() {
  return `SUB-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                    */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0, mb: 4 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Box key={label} sx={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: done ? "primary.main" : active ? "primary.main" : "action.disabledBackground",
                  color: done || active ? "#fff" : "text.disabled",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {done ? "✓" : i + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: active ? 700 : 400,
                  color: active ? "primary.main" : done ? "text.primary" : "text.disabled",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: done ? "primary.main" : "action.disabledBackground",
                  mx: 0.75,
                  mb: 2.5,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Program selection                                         */
/* ------------------------------------------------------------------ */

function ProgramStep({
  programs,
  deliverables,
  onSelect,
}: {
  programs: Program[];
  deliverables: Deliverable[];
  onSelect: (id: string) => void;
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Which program are you submitting for?
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Select the contract or program this deliverable belongs to.
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
        {programs.map((p) => {
          const progDeliverables = deliverables.filter((d) => d.programId === p.id);
          const pending = progDeliverables.filter(
            (d) => d.status !== "Submitted" && d.status !== "Approved"
          ).length;
          return (
            <Card key={p.id} variant="outlined" sx={{ "&:hover": { boxShadow: 3 } }}>
              <CardActionArea onClick={() => onSelect(p.id)} sx={{ p: 0.5 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {p.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", color: "text.secondary", display: "block", mb: 1 }}
                  >
                    {p.contractRef}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {progDeliverables.length} deliverables
                    {pending > 0 && ` · ${pending} pending`}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Deliverable selection                                     */
/* ------------------------------------------------------------------ */

function DeliverableStep({
  program,
  deliverables,
  onSelect,
  onBack,
}: {
  program: Program;
  deliverables: Deliverable[];
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const submittable = deliverables.filter(
    (d) => d.status !== "Submitted" && d.status !== "Approved"
  );

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} size="small" sx={{ color: "text.secondary", mb: 2 }} onClick={onBack}>
        Back
      </Button>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Which deliverable are you submitting?
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        {program.name} — <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{program.contractRef}</span>
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {submittable.map((d) => (
          <Card
            key={d.id}
            variant="outlined"
            sx={{ "&:hover": { boxShadow: 2 } }}
          >
            <CardActionArea onClick={() => onSelect(d.id)}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.secondary" }}>
                      {d.id}
                    </Typography>
                    <Chip
                      label={d.type}
                      size="small"
                      variant="outlined"
                      color={d.type === "CDRL" ? "primary" : "secondary"}
                      sx={{ fontSize: "0.65rem", height: 18 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {d.title}
                  </Typography>
                </Box>
                <Chip
                  label={d.status}
                  size="small"
                  sx={STATUS_CHIP_STYLE[d.status] ?? {}}
                />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {submittable.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
            All deliverables for this program are already approved.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: File upload                                               */
/* ------------------------------------------------------------------ */

function UploadStep({
  deliverable,
  program,
  onSubmit,
  onBack,
}: {
  deliverable: Deliverable;
  program: Program;
  onSubmit: (file: File) => void;
  onBack: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} size="small" sx={{ color: "text.secondary", mb: 2 }} onClick={onBack}>
        Back
      </Button>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Attach document
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        <Chip label={deliverable.id} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
        <Chip label={deliverable.title} size="small" variant="outlined" />
        <Chip label={program.name} size="small" />
      </Box>

      {/* Drop zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: "2px dashed",
          borderColor: dragging ? "primary.main" : file ? "success.main" : "divider",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: dragging ? "action.hover" : file ? "rgba(46,125,50,0.04)" : "background.paper",
          transition: "all 0.15s",
          mb: 2,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <Box>
            <CheckCircleIcon sx={{ fontSize: 36, color: "success.main", mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{file.name}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {(file.size / 1024).toFixed(0)} KB · Click to change
            </Typography>
          </Box>
        ) : (
          <Box>
            <UploadFileIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>Click or drag to attach a file</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              PDF, Word, Excel, or PowerPoint
            </Typography>
          </Box>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Once submitted, this document becomes part of the permanent record. Government reviewers will be
        notified and can view and download it, but cannot edit or delete it.
      </Alert>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" disabled={!file} onClick={() => file && onSubmit(file)}>
          Submit Document
        </Button>
        <Button component={Link} href="/documents" color="inherit">
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Confirmation                                              */
/* ------------------------------------------------------------------ */

function ConfirmationStep({
  deliverable,
  program,
  file,
  submissionRef,
  submissionTime,
  onSubmitAnother,
}: {
  deliverable: Deliverable;
  program: Program;
  file: File;
  submissionRef: string;
  submissionTime: string;
  onSubmitAnother: () => void;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Document submitted successfully
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This record is now permanent and time-stamped.
          </Typography>
        </Box>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[
            { label: "Submission reference", value: submissionRef, mono: true },
            { label: "Submitted at", value: new Date(submissionTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
            { label: "Document", value: file.name },
            { label: "Deliverable", value: `${deliverable.id} — ${deliverable.title}` },
            { label: "Program", value: `${program.name} (${program.contractRef})` },
          ].map(({ label, value, mono }) => (
            <Box key={label} sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 160, flexShrink: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem" }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: mono ? "monospace" : undefined, fontWeight: mono ? 700 : 400 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Alert severity="success" sx={{ mb: 3 }}>
        Government reviewers with access to <strong>{program.name}</strong> have been notified. This submission serves
        as irrefutable proof of delivery — the access log will record every view and download.
      </Alert>

      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button component={Link} href="/documents" variant="contained">
          View in Documents
        </Button>
        <Button onClick={onSubmitAnother} variant="outlined">
          Submit Another
        </Button>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Root wizard component                                             */
/* ------------------------------------------------------------------ */

interface SubmitReportWizardProps {
  programs: Program[];
  deliverables: Deliverable[];
  initialProgramId?: string;
  initialDeliverableId?: string;
}

export default function SubmitReportWizard({
  programs,
  deliverables,
  initialProgramId,
  initialDeliverableId,
}: SubmitReportWizardProps) {
  // If launched from a deliverable deep-link, jump straight to upload to reduce click-through.
  const prefilled = !!(initialProgramId && initialDeliverableId);
  const [step, setStep] = useState(prefilled ? 2 : 0);
  const [programId, setProgramId] = useState<string | null>(initialProgramId ?? null);
  const [deliverableId, setDeliverableId] = useState<string | null>(initialDeliverableId ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [submissionRef, setSubmissionRef] = useState("");
  const [submissionTime, setSubmissionTime] = useState("");

  const program = programs.find((p) => p.id === programId) ?? null;
  const deliverable = deliverables.find((d) => d.id === deliverableId) ?? null;
  const programDeliverables = deliverables.filter((d) => d.programId === programId);

  const handleProgramSelect = (id: string) => {
    // Program changes invalidate prior deliverable selection.
    setProgramId(id);
    setDeliverableId(null);
    setStep(1);
  };

  const handleDeliverableSelect = (id: string) => {
    setDeliverableId(id);
    setStep(2);
  };

  const handleSubmit = (f: File) => {
    setFile(f);
    setSubmissionRef(genSubmissionRef());
    setSubmissionTime(new Date().toISOString());
    setStep(3);
  };

  const handleReset = () => {
    setProgramId(null);
    setDeliverableId(null);
    setFile(null);
    setStep(0); // always go to program picker on "submit another"
  };

  return (
    <Box>
      <StepIndicator current={step} />

      {step === 0 && (
        <ProgramStep programs={programs} deliverables={deliverables} onSelect={handleProgramSelect} />
      )}
      {step === 1 && program && (
        <DeliverableStep
          program={program}
          deliverables={programDeliverables}
          onSelect={handleDeliverableSelect}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && program && deliverable && (
        <UploadStep
          deliverable={deliverable}
          program={program}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && program && deliverable && file && (
        <ConfirmationStep
          deliverable={deliverable}
          program={program}
          file={file}
          submissionRef={submissionRef}
          submissionTime={submissionTime}
          onSubmitAnother={handleReset}
        />
      )}
    </Box>
  );
}
