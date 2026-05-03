import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function UnauthorizedPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Alert severity="error">
        <Typography variant="h6">Access restricted</Typography>
        You are signed in, but your account does not have permission to access this resource.
      </Alert>
    </Container>
  );
}
