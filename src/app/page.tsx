import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { MockConnector } from "@/lib/connectors/mock-connector";
import UpdateFeed from "@/components/UpdateFeed";
import StatsSummary from "@/components/StatsSummary";
import FeedSkeleton from "@/components/FeedSkeleton";

async function DashboardContent() {
  const connector = new MockConnector();
  const events = await connector.getUpdates();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <StatsSummary events={events} />
      <UpdateFeed events={events} />
    </Box>
  );
}

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h5">Update Feed</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
            Cross-department activity from across the organization
          </Typography>
        </Box>
        <Suspense fallback={<FeedSkeleton />}>
          <DashboardContent />
        </Suspense>
      </Container>
    </Box>
  );
}
