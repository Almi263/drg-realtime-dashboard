"use client";

// Demo RBAC, swappable for MSAL when we get a real tenant
import { createContext, useContext, useState } from "react";

export const ROLES = ["drg-admin", "drg-staff", "gov-reviewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  "drg-admin": "DRG Admin",
  "drg-staff": "DRG Staff",
  "gov-reviewer": "Gov Reviewer",
};

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: "drg-admin",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("drg-admin");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
