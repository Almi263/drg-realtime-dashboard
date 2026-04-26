"use client";

import AccessRestrictedNotice from "@/components/AccessRestrictedNotice";
import DocumentDetail from "@/components/DocumentDetail";
import { useRole } from "@/lib/context/role-context";
import type { DeliverableDocument } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";

interface ProtectedDocumentDetailProps {
  doc: DeliverableDocument;
  deliverableTitle: string;
  program: Program | undefined;
}

export default function ProtectedDocumentDetail(props: ProtectedDocumentDetailProps) {
  const { canViewProgram } = useRole();

  if (!canViewProgram(props.doc.programId)) {
    return (
      <AccessRestrictedNotice message="This account does not currently have access to the program associated with this document." />
    );
  }

  return <DocumentDetail {...props} />;
}
