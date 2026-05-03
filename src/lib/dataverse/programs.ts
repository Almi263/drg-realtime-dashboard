import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { normalizeEmail } from "@/lib/auth/roles";
import type { Program } from "@/lib/models/program";
import {
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listActiveProgramAccess } from "@/lib/dataverse/program-access";

interface DataverseProgramRow extends Record<string, unknown> {
  drg_programid: string;
  drg_name?: string;
  drg_programnumber?: string;
  drg_contractref?: string;
  drg_description?: string;
  drg_startdate?: string;
  drg_enddate?: string;
  drg_creatorupn?: string;
  createdon?: string;
}

interface DataverseProgramSiteRow {
  drg_name?: string;
  _drg_program_value?: string;
}

function isInternalAllProgramsUser(user: DataverseUser) {
  return Boolean(user.internalRoles?.includes("drg-admin"));
}

function mapProgramRow(
  row: DataverseProgramRow,
  sites: DataverseProgramSiteRow[],
  accessByProgramId: Map<string, Awaited<ReturnType<typeof listActiveProgramAccess>>>
): Program {
  const id = row.drg_programid;

  return {
    id,
    name: row.drg_name ?? row.drg_programnumber ?? id,
    contractRef: row.drg_contractref ?? row.drg_programnumber ?? id,
    description: row.drg_description ?? "",
    sites: sites
      .filter((site) => site._drg_program_value === id)
      .map((site) => site.drg_name)
      .filter(Boolean) as string[],
    startDate: row.drg_startdate ?? "",
    endDate: row.drg_enddate ?? "",
    creatorEmail: normalizeEmail(row.drg_creatorupn),
    createdAt: row.createdon ?? "",
    accessList: (accessByProgramId.get(id) ?? []).map((entry) => ({
      email: entry.email,
      grantedAt: entry.grantedAt,
      grantedByEmail: entry.grantedByEmail,
    })),
  };
}

function groupAccessByProgramId(
  access: Awaited<ReturnType<typeof listActiveProgramAccess>>
) {
  const grouped = new Map<string, typeof access>();
  for (const entry of access) {
    grouped.set(entry.programId, [...(grouped.get(entry.programId) ?? []), entry]);
  }
  return grouped;
}

async function listActiveProgramsFromDataverse() {
  const [programRows, siteRows, access] = await Promise.all([
    listRows<DataverseProgramRow>(
      "drg_programs",
      "$select=drg_programid,drg_name,drg_programnumber,drg_contractref,drg_description,drg_startdate,drg_enddate,drg_creatorupn,createdon,drg_status&$filter=statecode eq 0"
    ),
    listRows<DataverseProgramSiteRow>(
      "drg_programsites",
      "$select=drg_name,_drg_program_value&$filter=statecode eq 0"
    ),
    listActiveProgramAccess(),
  ]);

  const accessByProgramId = groupAccessByProgramId(access);

  return programRows
    .filter((row) => getFormattedValue(row, "drg_status") !== "Archived")
    .map((row) => mapProgramRow(row, siteRows, accessByProgramId));
}

export async function listPrograms(): Promise<Program[]> {
  if (!isDataverseConfigured()) {
    return new MockProgramConnector().getPrograms();
  }

  return listActiveProgramsFromDataverse();
}

export async function listVisiblePrograms(user: DataverseUser): Promise<Program[]> {
  const programs = await listPrograms();

  if (isInternalAllProgramsUser(user)) {
    return programs;
  }

  const email = normalizeEmail(user.email);
  return programs.filter((program) =>
    program.accessList.some((entry) => normalizeEmail(entry.email) === email)
  );
}

export async function getProgramById(
  id: string,
  user?: DataverseUser
): Promise<Program | undefined> {
  const programs = user ? await listVisiblePrograms(user) : await listPrograms();
  return programs.find((program) => program.id === id);
}
