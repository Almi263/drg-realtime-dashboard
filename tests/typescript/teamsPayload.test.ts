import { describe, expect, it, vi } from "vitest";

interface DocumentUpdatedEvent {
  documentId: string;
  documentName: string;
  updatedBy: string;
  updatedAtIso: string;
  channelId: string;
}

interface TeamsClient {
  postMessage(params: { channelId: string; message: string }): void;
}

function notifyTeams(event: DocumentUpdatedEvent, teamsClient: TeamsClient): void {
  const message = [
    `Document updated: ${event.documentName}`,
    `Updated by: ${event.updatedBy}`,
    `Time: ${event.updatedAtIso}`,
  ].join("\n");

  teamsClient.postMessage({ channelId: event.channelId, message });
}

describe("notifyTeams", () => {
  it("sends notification with correct channel and message content", () => {
    const event: DocumentUpdatedEvent = {
      documentId: "doc-123",
      documentName: "Test Document.xlsx",
      updatedBy: "John Smith",
      updatedAtIso: "2026-01-29T14:56:00Z",
      channelId: "channel-abc",
    };

    const teamsClient: TeamsClient = {
      postMessage: vi.fn(),
    };

    notifyTeams(event, teamsClient);

    expect(teamsClient.postMessage).toHaveBeenCalledOnce();
    expect(teamsClient.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: "channel-abc",
        message: expect.stringContaining("Test Document.xlsx"),
      })
    );

    const call = vi.mocked(teamsClient.postMessage).mock.calls[0][0];
    expect(call.message).toContain("John Smith");
  });
});
