import { Box, Typography, Button, useTheme } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "scenes/navbar";

const NotFoundPage = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <Box minHeight="100vh" backgroundColor={palette.background.default}>
      {isAuth ? (
        <Navbar />
      ) : (
        <Box
          width="100%"
          backgroundColor={palette.background.alt}
          p="1rem 6%"
          textAlign="center"
        >
          <Typography fontWeight="bold" fontSize="32px" color="primary">
            Evermore
          </Typography>
        </Box>
      )}

      <Box
        width="100%"
        padding="5rem 6%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          p="3.5rem 2.5rem"
          backgroundColor={palette.background.alt}
          borderRadius="1rem"
          textAlign="center"
          maxWidth="520px"
          width="100%"
          boxShadow="0 6px 24px rgba(0,0,0,0.06)"
        >
          <ErrorOutline sx={{ fontSize: 64, color: palette.primary.main, mb: 2 }} />
          <Typography variant="h3" fontWeight="700" color={palette.neutral.dark} mb="0.5rem">
            404
          </Typography>
          <Typography variant="h5" fontWeight="600" color={palette.neutral.dark} mb="1rem">
            Page Not Found
          </Typography>
          <Typography variant="body1" color={palette.neutral.medium} mb="2rem">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(isAuth ? "/home" : "/")}
            sx={{
              p: "0.75rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {isAuth ? "Return to Feed" : "Return to Login"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
