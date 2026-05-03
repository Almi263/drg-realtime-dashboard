import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { normalizeEmail } from "@/lib/auth/roles";
import type { ProgramAccessGrant } from "@/lib/models/program";
import {
  dataverseFetch,
  escapeODataString,
  isDataverseConfigured,
  listRows,
  lookupBind,
} from "@/lib/dataverse/client";

interface DataverseProgramAccessRow {
  drg_programaccessid: string;
  drg_email?: string;
  drg_grantedon?: string;
  drg_grantedbyemail?: string;
  drg_isactive?: boolean;
  _drg_program_value?: string;
}

export interface ProgramAccessRecord extends ProgramAccessGrant {
  id: string;
  programId: string;
  isActive: boolean;
}

function mapAccessRow(row: DataverseProgramAccessRow): ProgramAccessRecord {
  return {
    id: row.drg_programaccessid,
    programId: row._drg_program_value ?? "",
    email: normalizeEmail(row.drg_email),
    grantedAt: row.drg_grantedon ?? new Date().toISOString(),
    grantedByEmail: normalizeEmail(row.drg_grantedbyemail),
    isActive: row.drg_isactive !== false,
  };
}

export async function listActiveProgramAccess(): Promise<ProgramAccessRecord[]> {
  if (!isDataverseConfigured()) {
    const programs = await new MockProgramConnector().getPrograms();
    return programs.flatMap((program) =>
      program.accessList.map((grant, index) => ({
        ...grant,
        id: `${program.id}-${index}`,
        programId: program.id,
        isActive: true,
      }))
    );
  }

  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_programaccesses",
    "$select=drg_programaccessid,drg_email,drg_grantedon,drg_grantedbyemail,drg_isactive,_drg_program_value&$filter=statecode eq 0 and drg_isactive eq true"
  );

  return rows.map(mapAccessRow);
}

export async function listProgramAccess(
  programId: string
): Promise<ProgramAccessRecord[]> {
  if (!isDataverseConfigured()) {
    const program = await new MockProgramConnector().getProgramById(programId);
    return (program?.accessList ?? []).map((grant, index) => ({
      ...grant,
      id: `${programId}-${index}`,
      programId,
      isActive: true,
    }));
  }

  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_programaccesses",
    `$select=drg_programaccessid,drg_email,drg_grantedon,drg_grantedbyemail,drg_isactive,_drg_program_value&$filter=statecode eq 0 and drg_isactive eq true and _drg_program_value eq ${programId}`
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
  accessRole?: "Program Owner" | "DRG Staff" | "External Reviewer" | "Read Only";
  entraObjectId?: string;
}) {
  const email = normalizeEmail(input.email);
  const grantedByEmail = normalizeEmail(input.grantedByEmail);

  if (!isDataverseConfigured()) {
    return {
      id: `${input.programId}-${email}`,
      programId: input.programId,
      email,
      grantedAt: new Date().toISOString(),
      grantedByEmail,
      isActive: true,
    } satisfies ProgramAccessRecord;
  }

  const payload: Record<string, unknown> = {
    drg_name: `${input.programNumber ?? input.programId} | ${email}`,
    "drg_program@odata.bind": lookupBind("drg_programs", input.programId),
    drg_email: email,
    drg_accessrole: input.accessRole ?? "External Reviewer",
    drg_isactive: true,
    drg_grantedon: new Date().toISOString(),
    drg_grantedbyemail: grantedByEmail,
  };

  if (input.entraObjectId) {
    payload.drg_entraobjectid = input.entraObjectId;
  }

  await dataverseFetch<void>("/drg_programaccesses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    id: `${input.programId}-${email}`,
    programId: input.programId,
    email,
    grantedAt: new Date().toISOString(),
    grantedByEmail,
    isActive: true,
  } satisfies ProgramAccessRecord;
}

export async function revokeProgramAccess(input: {
  programId: string;
  email: string;
  revokedByEmail: string;
}) {
  if (!isDataverseConfigured()) return;

  const email = normalizeEmail(input.email);
  const rows = await listRows<DataverseProgramAccessRow>(
    "drg_programaccesses",
    `$select=drg_programaccessid&$top=1&$filter=statecode eq 0 and _drg_program_value eq ${input.programId} and drg_email eq '${escapeODataString(email)}'`
  );

  const accessId = rows[0]?.drg_programaccessid;
  if (!accessId) return;

  await dataverseFetch<void>(`/drg_programaccesses(${accessId})`, {
    method: "PATCH",
    body: JSON.stringify({
      drg_isactive: false,
      drg_revokedon: new Date().toISOString(),
      drg_revokedbyemail: normalizeEmail(input.revokedByEmail),
    }),
  });
}
