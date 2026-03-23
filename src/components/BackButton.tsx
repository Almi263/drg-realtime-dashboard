"use client";

import Button from "@mui/material/Button";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface BackButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function BackButton({ href, children }: BackButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      startIcon={<ArrowBackIcon />}
      size="small"
      sx={{ mb: 2, color: "text.secondary" }}
    >
      {children}
    </Button>
  );
}
