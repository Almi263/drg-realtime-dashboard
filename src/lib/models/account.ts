import type { EffectiveRole } from "@/lib/auth/roles";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: EffectiveRole;
}
