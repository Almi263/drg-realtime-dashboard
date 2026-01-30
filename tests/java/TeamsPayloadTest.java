import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class TeamsPayloadTest {
  record DocumentUpdatedEvent(
      String documentId,
      String documentName,
      String updatedBy,
      String updatedAtIso,
      String channelId
  ) {}

  interface TeamsClient {
    void postMessage(String channelId, String message);
  }

  static class TeamsNotifier {
    static void notifyTeams(DocumentUpdatedEvent event, TeamsClient teamsClient) {
      String message =
          "Document updated: " + event.documentName() + "\n" +
          "Updated by: " + event.updatedBy() + "\n" +
          "Time: " + event.updatedAtIso();

      teamsClient.postMessage(event.channelId(), message);
    }
  }

  @Test
  void testNotificationOfUpdate() {
    var event = new DocumentUpdatedEvent(
        "doc-123",
        "Test Document.xlsx",
        "John Smith",
        "2026-01-29T14:56:00Z",
        "channel-abc"
    );

    TeamsClient teamsClient = mock(TeamsClient.class);

    TeamsNotifier.notifyTeams(event, teamsClient);

    verify(teamsClient, times(1)).postMessage(
        eq("channel-abc"),
        argThat(msg -> msg.contains("Test Document.xlsx") && msg.contains("John Smith"))
    );
    verifyNoMoreInteractions(teamsClient);
  }
}
