import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import BackButton from "@/components/BackButton";
import ProgramAccessPageView from "@/components/ProgramAccessPageView";

function ProgramAccessContent({ id }: { id: string }) {
  return <ProgramAccessPageView programId={id} />;
}

export default async function ProgramAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <BackButton href={`/programs/${id}`}>Program Overview</BackButton>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProgramAccessContent id={id} />
      </Suspense>
    </Container>
  );
}
