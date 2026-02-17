import type { UpdateEvent } from "@/lib/models/update-event";

export interface UpdateConnector {
  /** Human-readable name for this connector (e.g. "SharePoint", "Power BI"). */
  readonly name: string;
  /** Fetch the latest update events from this source. */
  getUpdates(): Promise<UpdateEvent[]>;
}
