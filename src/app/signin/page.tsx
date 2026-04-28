import drgLogo from "../../../public/drg-logo-transparent-background.png";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { auth, signIn } from "@/auth";

const MICROSOFT_BLUE = "#002050";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        backgroundColor: MICROSOFT_BLUE,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 0.5,
            border: "1px solid",
            borderColor: "rgba(0,32,80,0.12)",
            backgroundColor: "#fff",
            color: "#002050",
            boxShadow: "0 24px 60px rgba(0, 24, 61, 0.35)",
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box sx={{ width: "100%", maxWidth: 280 }}>
              <Box
                component="img"
                src={drgLogo.src}
                alt="Delaware Resource Group"
                sx={{ width: "100%", height: "auto", display: "block" }}
              />
            </Box>

            <Stack spacing={0.75} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Information Management System
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 420 }}>
                Sign in with your Delaware Resource Group Microsoft account for access.
              </Typography>
            </Stack>

            <form
              action={async () => {
                "use server";
                await signIn("microsoft-entra-id", { redirectTo: "/" });
              }}
              style={{ width: "72%", alignSelf: "center" }}
            >
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={
                  <Box
                    component="span"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 7px)",
                      gap: "2px",
                    }}
                  >
                    {["#f25022", "#7fba00", "#00a4ef", "#ffb900"].map((color) => (
                      <Box
                        key={color}
                        component="span"
                        sx={{
                          width: 7,
                          height: 7,
                          bgcolor: color,
                          display: "block",
                        }}
                      />
                    ))}
                  </Box>
                }
                sx={{
                  py: 1.4,
                  fontWeight: 700,
                  borderRadius: 0.5,
                  bgcolor: MICROSOFT_BLUE,
                  boxShadow: "none",
                  justifyContent: "flex-start",
                  px: 2,
                  "& .MuiButton-startIcon": {
                    marginLeft: 0,
                    marginRight: 6,
                  },
                  "&:hover": {
                    bgcolor: MICROSOFT_BLUE,
                    boxShadow: "none",
                  },
                }}
              >
                Sign in with Microsoft
              </Button>
            </form>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Need access? Contact your DRG administrator.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
