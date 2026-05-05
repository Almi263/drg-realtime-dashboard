import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { normalizeEmail } from "@/lib/auth/roles";
import type { ProgramAccess, ProgramAccessRole } from "@/lib/models/program";
import {
  dataverseFetch,
  DataverseError,
  escapeODataString,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
} from "@/lib/dataverse/client";
import { businessRuleError } from "@/lib/errors/business-rules";

interface DataverseProgramAccessRow extends Record<string, unknown> {
  drg_drg_programaccessid: string;
  drg_drg_email?: string;
  drg_drg_grantedon?: string;
  drg_drg_grantedbyemail?: string;
  drg_drg_isactive?: boolean;
  _drg_drg_program_value?: string;
  _drg_drg_user_value?: string;
  drg_drg_revokedon?: string;
  drg_drg_revokedbyemail?: string;
  drg_drg_entraobjectid?: string;
}

export type ProgramAccessRecord = ProgramAccess;

function toProgramAccessRole(value: string | undefined): ProgramAccessRole {
  switch (value) {
    case "Program Owner":
    case "DRG Staff":
    case "External Reviewer":
    case "Read Only":
      return value;
    default:
      return "External Reviewer";
  }
}

function mapAccessRow(row: DataverseProgramAccessRow): ProgramAccessRecord {
  return {
    id: row.drg_drg_programaccessid,
    programId: row._drg_drg_program_value ?? "",
    userId: row._drg_drg_user_value,
    email: normalizeEmail(row.drg_drg_email),
    accessRole: toProgramAccessRole(getFormattedValue(row, "drg_drg_accessrole")),
    grantedAt: row.drg_drg_grantedon ?? new Date().toISOString(),
    grantedByEmail: normalizeEmail(row.drg_drg_grantedbyemail),
    isActive: row.drg_drg_isactive !== false,
    revokedAt: row.drg_drg_revokedon,
    revokedByEmail: normalizeEmail(row.drg_drg_revokedbyemail),
    entraObjectId: row.drg_drg_entraobjectid,
  };
}

export async function listActiveProgramAccess(): Promise<ProgramAccessRecord[]> {
  if (!isDataverseConfigured()) {
    const programs = await new MockProgramConnector().getPrograms();
    return programs.flatMap((program) =>
      (
        (program as unknown as { accessList?: ProgramAccess[] }).accessList ??
        []
      ).map((grant, index) => ({
        ...grant,
        id: `${program.id}-${index}`,
        programId: program.id,
        accessRole: grant.accessRole ?? "External Reviewer",
        isActive: true,
      }))
    );
  }

  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_drg_programaccesses",
    "$select=drg_drg_programaccessid,drg_drg_email,drg_drg_grantedon,drg_drg_grantedbyemail,drg_drg_isactive,_drg_drg_program_value,_drg_drg_user_value,drg_drg_revokedon,drg_drg_revokedbyemail,drg_drg_entraobjectid,drg_drg_accessrole&$filter=statecode eq 0 and drg_drg_isactive eq true"
  );

  return rows.map(mapAccessRow);
}

export async function listProgramAccess(
  programId: string
): Promise<ProgramAccessRecord[]> {
  if (!isDataverseConfigured()) {
    const program = await new MockProgramConnector().getProgramById(programId);
    return (
      (program as unknown as { accessList?: ProgramAccess[] } | undefined)
        ?.accessList ?? []
    ).map((grant, index) => ({
      ...grant,
      id: `${programId}-${index}`,
      programId,
      accessRole: grant.accessRole ?? "External Reviewer",
      isActive: true,
    }));
  }

  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_drg_programaccesses",
    `$select=drg_drg_programaccessid,drg_drg_email,drg_drg_grantedon,drg_drg_grantedbyemail,drg_drg_isactive,_drg_drg_program_value,_drg_drg_user_value,drg_drg_revokedon,drg_drg_revokedbyemail,drg_drg_entraobjectid,drg_drg_accessrole&$filter=statecode eq 0 and _drg_drg_program_value eq ${programId}`
  );

  return rows.map(mapAccessRow);
}

export async function hasActiveProgramAccess(
  programId: string,
  email: string | null | undefined
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const access = await listProgramAccess(programId);
  return access.some((entry) => normalizeEmail(entry.email) === normalizedEmail);
}

export async function createProgramAccess(input: {
  programId: string;
  programNumber?: string;
  email: string;
  grantedByEmail: string;
  accessRole?: ProgramAccessRole;
  entraObjectId?: string;
}) {
  const email = normalizeEmail(input.email);
  const grantedByEmail = normalizeEmail(input.grantedByEmail);

  if (!isDataverseConfigured()) {
    const existing = await listProgramAccess(input.programId);
    const matching = existing.find((entry) => entry.email === email);
    if (matching) {
      throw businessRuleError("duplicateProgramAccess");
    }

    return {
      id: `${input.programId}-${email}`,
      programId: input.programId,
      email,
      accessRole: input.accessRole ?? "External Reviewer",
      grantedAt: new Date().toISOString(),
      grantedByEmail,
      isActive: true,
    } satisfies ProgramAccessRecord;
  }

  const existing = await listProgramAccess(input.programId);
  const matching = existing.find((entry) => entry.email === email);
  if (matching) {
    throw businessRuleError("duplicateProgramAccess");
  }

  const payload: Record<string, unknown> = {
    drg_drg_name: `${input.programNumber ?? input.programId} | ${email}`,
    "drg_drg_program@odata.bind": lookupBind("drg_drg_programs", input.programId),
    drg_drg_email: email,
    drg_drg_accessrole: input.accessRole ?? "External Reviewer",
    drg_drg_isactive: true,
    drg_drg_grantedon: new Date().toISOString(),
    drg_drg_grantedbyemail: grantedByEmail,
  };

  if (input.entraObjectId) {
    payload.drg_drg_entraobjectid = input.entraObjectId;
  }

  try {
    await dataverseFetch<void>("/drg_drg_programaccesses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof DataverseError && error.isAlternateKeyConflict) {
      throw businessRuleError("duplicateProgramAccess");
    }

    throw error;
  }

  return {
    id: `${input.programId}-${email}`,
    programId: input.programId,
    email,
    accessRole: input.accessRole ?? "External Reviewer",
    grantedAt: new Date().toISOString(),
    grantedByEmail,
    isActive: true,
  } satisfies ProgramAccessRecord;
}

export async function revokeProgramAccess(input: {
  programId: string;
  email: string;
}) {
  if (!isDataverseConfigured()) return;

  const email = normalizeEmail(input.email);
  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_drg_programaccesses",
    `$select=drg_drg_programaccessid&$top=1&$filter=statecode eq 0 and _drg_drg_program_value eq ${input.programId} and drg_drg_email eq '${escapeODataString(email)}'`
  );

  const accessId = rows[0]?.drg_drg_programaccessid;
  if (!accessId) return;

  await dataverseFetch<void>(`/drg_drg_programaccesses(${accessId})`, {
    method: "PATCH",
    body: JSON.stringify({
      drg_drg_isactive: false,
    }),
  });
}
