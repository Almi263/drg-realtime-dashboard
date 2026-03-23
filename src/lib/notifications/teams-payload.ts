import type { UpdateEvent } from "@/lib/models/update-event";

export interface TeamsMessagePayload {
  channelId: string;
  text: string;
}

/**
 * Build a plain-text Teams notification message from an UpdateEvent.
 * Pure function — no side effects, no API calls.
 */
export function buildTeamsPayload(
  event: UpdateEvent,
  channelId: string,
): TeamsMessagePayload {
  const lines = [
    `[${event.source.toUpperCase()}] ${event.title}`,
    event.summary,
    `By: ${event.updatedBy}  |  ${formatTimestamp(event.updatedAt)}`,
  ];

  if (event.resourceUrl) {
    lines.push(`Link: ${event.resourceUrl}`);
  }

  return {
    channelId,
    text: lines.join("\n"),
  };
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
