import { describe, expect, it } from "vitest";
import { buildTeamsPayload } from "@/lib/notifications/teams-payload";
import type { UpdateEvent } from "@/lib/models/update-event";

const baseEvent: UpdateEvent = {
  id: "evt-001",
  source: "sharepoint",
  department: "engineering",
  title: "Q1 Architecture Review uploaded",
  summary: "John Smith uploaded Q1 Architecture Review.pptx to the Engineering shared drive.",
  updatedBy: "John Smith",
  updatedAt: "2026-02-16T09:15:00Z",
};

describe("buildTeamsPayload", () => {
  it("returns the correct channelId", () => {
    const payload = buildTeamsPayload(baseEvent, "channel-eng");
    expect(payload.channelId).toBe("channel-eng");
  });

  it("includes source tag, title, summary, and author in the text", () => {
    const payload = buildTeamsPayload(baseEvent, "channel-eng");
    expect(payload.text).toContain("[SHAREPOINT]");
    expect(payload.text).toContain("Q1 Architecture Review uploaded");
    expect(payload.text).toContain("John Smith uploaded Q1 Architecture Review.pptx");
    expect(payload.text).toContain("By: John Smith");
  });

  it("includes a formatted timestamp", () => {
    const payload = buildTeamsPayload(baseEvent, "ch-1");
    // The exact format depends on locale, but should contain the date parts
    expect(payload.text).toContain("2026");
    expect(payload.text).toContain("Feb");
  });

  it("includes resource URL when present", () => {
    const eventWithUrl: UpdateEvent = {
      ...baseEvent,
      resourceUrl: "https://contoso.sharepoint.com/sites/eng/docs/review.pptx",
    };
    const payload = buildTeamsPayload(eventWithUrl, "ch-1");
    expect(payload.text).toContain("Link: https://contoso.sharepoint.com/sites/eng/docs/review.pptx");
  });

  it("omits link line when resourceUrl is absent", () => {
    const payload = buildTeamsPayload(baseEvent, "ch-1");
    expect(payload.text).not.toContain("Link:");
  });

  it("works for different source types", () => {
    const sources = ["teams", "power-bi", "power-automate", "dynamics", "sharepoint"] as const;
    for (const source of sources) {
      const event: UpdateEvent = { ...baseEvent, source };
      const payload = buildTeamsPayload(event, "ch-1");
      expect(payload.text).toContain(`[${source.toUpperCase()}]`);
    }
  });
});
