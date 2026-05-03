"use client";

import Button from "@mui/material/Button";
import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <Button color="inherit" size="small" onClick={() => signIn("microsoft-entra-id")}>
      Sign in
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button color="inherit" size="small" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
