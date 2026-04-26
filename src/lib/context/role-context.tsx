"use client";

// Demo RBAC, swappable for MSAL when we get a real tenant
import { createContext, useContext, useMemo, useState } from "react";
import { MOCK_PROGRAMS } from "@/lib/connectors/mock-programs";
import type { Account } from "@/lib/models/account";
import type { Program, ProgramAccessGrant } from "@/lib/models/program";

export const ROLES = ["drg-admin", "drg-staff", "gov-reviewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  "drg-admin": "DRG Admin",
  "drg-staff": "DRG Staff",
  "gov-reviewer": "Gov Reviewer",
};

type ProgramAccessMap = Record<string, ProgramAccessGrant[]>;

export const ACCOUNTS: Account[] = [
  {
    id: "acct-001",
    name: "Samantha Reed",
    email: "samantha.reed@drgok.com",
    role: "drg-admin",
  },
  {
    id: "acct-002",
    name: "Javier Morales",
    email: "javier.morales@drgok.com",
    role: "drg-staff",
  },
  {
    id: "acct-003",
    name: "Erin Choi",
    email: "erin.choi@drgok.com",
    role: "drg-staff",
  },
  {
    id: "acct-004",
    name: "Kelly Madison",
    email: "kelly.madison@navy.mil",
    role: "gov-reviewer",
  },
  {
    id: "acct-005",
    name: "Marcus Hill",
    email: "marcus.hill@us.af.mil",
    role: "gov-reviewer",
  },
];

function buildInitialAccessMap(): ProgramAccessMap {
  return Object.fromEntries(
    MOCK_PROGRAMS.map((program) => [program.id, program.accessList])
  );
}

function findAccountByEmail(email: string) {
  return ACCOUNTS.find((account) => account.email === email);
}

interface CreateProgramInput {
  name: string;
  contractRef: string;
  description: string;
  sites: string[];
  startDate: string;
  endDate: string;
}

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  accounts: Account[];
  currentUser: Account;
  setCurrentUserEmail: (email: string) => void;
  programs: Program[];
  getProgramById: (programId: string) => Program | undefined;
  getProgramAccessList: (programId: string) => Array<ProgramAccessGrant & { account?: Account }>;
  canViewProgram: (programId: string) => boolean;
  canManageProgramAccess: (programId: string) => boolean;
  canGrantProgramAccess: (programId: string, email: string) => boolean;
  canRevokeProgramAccess: (programId: string, email: string) => boolean;
  createProgram: (input: CreateProgramInput) => void;
  grantProgramAccess: (programId: string, email: string) => void;
  revokeProgramAccess: (programId: string, email: string) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "drg-admin",
  setRole: () => {},
  accounts: ACCOUNTS,
  currentUser: ACCOUNTS[0],
  setCurrentUserEmail: () => {},
  programs: MOCK_PROGRAMS,
  getProgramById: () => undefined,
  getProgramAccessList: () => [],
  canViewProgram: () => true,
  canManageProgramAccess: () => true,
  canGrantProgramAccess: () => false,
  canRevokeProgramAccess: () => false,
  createProgram: () => {},
  grantProgramAccess: () => {},
  revokeProgramAccess: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(ACCOUNTS[0].email);
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS);
  const [programAccessMap, setProgramAccessMap] = useState<ProgramAccessMap>(buildInitialAccessMap);

  const currentUser = useMemo(
    () => findAccountByEmail(currentUserEmail) ?? ACCOUNTS[0],
    [currentUserEmail]
  );

  const role = currentUser.role;
  const getProgramById = (programId: string) =>
    programs.find((program) => program.id === programId);

  const setRole = (nextRole: Role) => {
    const matchingAccount = ACCOUNTS.find((account) => account.role === nextRole);
    if (matchingAccount) {
      setCurrentUserEmail(matchingAccount.email);
    }
  };

  const getProgramAccessList = (programId: string) => {
    const entries = programAccessMap[programId] ?? [];
    return entries.map((entry) => ({
      ...entry,
      account: findAccountByEmail(entry.email),
    }));
  };

  const canViewProgram = (programId: string) => {
    if (role === "drg-admin") return true;
    return (programAccessMap[programId] ?? []).some((entry) => entry.email === currentUser.email);
  };

  const canManageProgramAccess = (programId: string) => {
    if (role === "drg-admin") return true;
    if (role !== "drg-staff") return false;
    return canViewProgram(programId);
  };

  const isProgramCreator = (programId: string) => {
    const program = getProgramById(programId);
    return program?.creatorEmail === currentUser.email;
  };

  const canGrantProgramAccess = (programId: string, email: string) => {
    const targetAccount = findAccountByEmail(email);
    if (!targetAccount || !canManageProgramAccess(programId)) return false;
    if ((programAccessMap[programId] ?? []).some((entry) => entry.email === email)) return false;
    if (role === "drg-admin") return true;
    if (targetAccount.role === "gov-reviewer") return true;
    if (targetAccount.role === "drg-staff") return true;
    return false;
  };

  const canRevokeProgramAccess = (programId: string, email: string) => {
    const targetAccount = findAccountByEmail(email);
    if (!targetAccount || !canManageProgramAccess(programId)) return false;
    if (!(programAccessMap[programId] ?? []).some((entry) => entry.email === email)) return false;
    if (role === "drg-admin") return true;
    if (email === currentUser.email) return false;
    if (targetAccount.role === "gov-reviewer") return true;
    if (targetAccount.role === "drg-staff") return isProgramCreator(programId);
    return false;
  };

  const createProgram = (input: CreateProgramInput) => {
    if (role !== "drg-admin" && role !== "drg-staff") return;

    const createdAt = new Date().toISOString();
    const nextNumber = programs.length + 1;
    const programId = `PROG-${String(nextNumber).padStart(3, "0")}`;
    const newProgram: Program = {
      id: programId,
      name: input.name,
      contractRef: input.contractRef,
      description: input.description,
      sites: input.sites,
      startDate: input.startDate,
      endDate: input.endDate,
      creatorEmail: currentUser.email,
      createdAt,
      accessList: [
        {
          email: currentUser.email,
          grantedAt: createdAt,
          grantedByEmail: currentUser.email,
        },
      ],
    };

    setPrograms((prev) => [...prev, newProgram]);
    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: newProgram.accessList,
    }));
  };

  const grantProgramAccess = (programId: string, email: string) => {
    if (!canGrantProgramAccess(programId, email)) return;

    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: [
        ...(prev[programId] ?? []),
        {
          email,
          grantedAt: new Date().toISOString(),
          grantedByEmail: currentUser.email,
        },
      ],
    }));
  };

  const revokeProgramAccess = (programId: string, email: string) => {
    if (!canRevokeProgramAccess(programId, email)) return;

    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: (prev[programId] ?? []).filter((entry) => entry.email !== email),
    }));
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        accounts: ACCOUNTS,
        currentUser,
        setCurrentUserEmail,
        programs,
        getProgramById,
        getProgramAccessList,
        canViewProgram,
        canManageProgramAccess,
        canGrantProgramAccess,
        canRevokeProgramAccess,
        createProgram,
        grantProgramAccess,
        revokeProgramAccess,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
