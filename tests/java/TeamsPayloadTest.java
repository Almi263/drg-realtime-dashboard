// test_update_notification.java

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;

class TeamsNotifierTest{

  record DocumentUpdatedEvent(
      String documentId,
      String documentName,
      String updatedBy,
      String updatedAtIso,
      String channelId
  ) {}

  interface TeamsClient{
    void postMessage(String channelId, String message);
  }

  // unit being tested
  static class notifyTeams{
    static void notifyTeams(DocumentUpdatedEvent event, TeamsClient teamsClient) {
      String message =
          "Document updated: " + event.documentName() + "\n" +
          "Updated by: " + event.updatedBy() + "\n" +
          "Time: " + event.updatedAtIso();

      teamsClient.postMessage(event.channelId(), message);
    }
  }

  @Test
  void testNotificationOfUpdate(){
    var event = DocumentUpdatedEvent(
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
        argThat(msg -> msg.contains("Training Schedule.xlsx") && msg.contains("Allison Helling"))
    );
    verifyNoMoreInteractions(teamsClient);
  }
}
