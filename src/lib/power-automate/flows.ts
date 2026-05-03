export type FlowName =
  | "submissionCreated"
  | "documentDownloaded"
  | "approvalDecisionSubmitted"
  | "programAccessChanged";

const FLOW_URLS: Record<FlowName, string | undefined> = {
  submissionCreated: process.env.POWER_AUTOMATE_SUBMISSION_CREATED_URL,
  documentDownloaded: process.env.POWER_AUTOMATE_DOCUMENT_DOWNLOADED_URL,
  approvalDecisionSubmitted:
    process.env.POWER_AUTOMATE_APPROVAL_DECISION_SUBMITTED_URL,
  programAccessChanged: process.env.POWER_AUTOMATE_PROGRAM_ACCESS_CHANGED_URL,
};

export async function triggerFlow(
  flowName: FlowName,
  payload: Record<string, unknown>
) {
  const url = FLOW_URLS[flowName];
  if (!url) return { skipped: true };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Power Automate flow failed: ${response.status}${details ? ` - ${details}` : ""}`
    );
  }

  return { skipped: false };
}
