export interface Account {
  id: string;
  name: string;
  email: string;
  role: "drg-admin" | "drg-staff" | "gov-reviewer";
}
