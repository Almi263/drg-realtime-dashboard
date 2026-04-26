"use client";

import AccessRestrictedNotice from "@/components/AccessRestrictedNotice";
import DeliverableDetail from "@/components/DeliverableDetail";
import { useRole } from "@/lib/context/role-context";
import type { Deliverable } from "@/lib/models/deliverable";
import type { DeliverableDocument } from "@/lib/models/document";
import type { Program } from "@/lib/models/program";

interface ProtectedDeliverableDetailProps {
  deliverable: Deliverable;
  documents: DeliverableDocument[];
  program: Program | undefined;
}

export default function ProtectedDeliverableDetail(props: ProtectedDeliverableDetailProps) {
  const { canViewProgram } = useRole();

  if (!canViewProgram(props.deliverable.programId)) {
    return (
      <AccessRestrictedNotice message="This account does not currently have access to the program associated with this record." />
    );
  }

  return <DeliverableDetail {...props} />;
}
