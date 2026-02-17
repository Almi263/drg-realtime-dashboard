import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";

export default function FeedSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Stats skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 1.5,
        }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Skeleton variant="text" width={40} sx={{ fontSize: "1.35rem" }} />
              <Skeleton variant="text" width={56} sx={{ fontSize: "0.65rem" }} />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filter skeleton */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Skeleton variant="text" width={50} sx={{ fontSize: "0.75rem" }} />
        <Skeleton variant="rounded" width={140} height={36} />
        <Skeleton variant="rounded" width={140} height={36} />
      </Box>

      {/* Card skeletons */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                p: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Skeleton variant="rounded" width={72} height={22} />
                <Skeleton variant="text" width={56} sx={{ fontSize: "0.75rem" }} />
                <Skeleton
                  variant="text"
                  width={36}
                  sx={{ fontSize: "0.75rem", ml: "auto" }}
                />
              </Box>
              <Skeleton variant="text" width="55%" sx={{ fontSize: "1rem" }} />
              <Skeleton variant="text" width="85%" sx={{ fontSize: "0.875rem" }} />
              <Skeleton variant="text" width="45%" sx={{ fontSize: "0.875rem" }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
