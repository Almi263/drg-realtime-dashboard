from dataclasses import dataclass
from unittest.mock import Mock


@dataclass(frozen=True)
class DocumentUpdatedEvent:
    document_id: str
    document_name: str
    updated_by: str
    updated_at_iso: str
    channel_id: str


def notify_teams(event: DocumentUpdatedEvent, teams_client) -> None:
    message = (
        f"Document updated: {event.document_name}\n"
        f"Updated by: {event.updated_by}\n"
        f"Time: {event.updated_at_iso}"
    )
    teams_client.post_message(channel_id=event.channel_id, message=message)


def test_notification_of_update():
    event = DocumentUpdatedEvent(
        document_id="doc-123",
        document_name="Test Document.xlsx",
        updated_by="John Smith",
        updated_at_iso="2026-01-29T14:56:00Z",
        channel_id="channel-abc",
    )
    teams_client = Mock()

    notify_teams(event, teams_client)

    teams_client.post_message.assert_called_once()
    _, kwargs = teams_client.post_message.call_args
    assert kwargs["channel_id"] == "channel-abc"
    assert "Test Document.xlsx" in kwargs["message"]
    assert "John Smith" in kwargs["message"]
