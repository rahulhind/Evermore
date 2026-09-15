import { Box, Typography, useMediaQuery, useTheme, Skeleton, Button } from "@mui/material";
import { host } from "hs";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";
import WidgetWrapper from "components/WidgetWrapper";
import { track } from "spectra";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user?._id);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { palette } = useTheme();

  // Flaky deeplink simulation: for ~15% of visitors (or explicit ?broken=true),
  // deeplink resolves to an empty/ghost container. Spectra's GhostDetector trips ghost_render!
  const isBrokenDeeplink = useMemo(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("broken=true")) return true;
      if (search.includes("healthy=true")) return false;
    }
    return Math.random() < 0.15;
  }, []);

  const getUser = async () => {
    if (isBrokenDeeplink) {
      console.warn("Simulating broken deeplink for profile:", userId);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}users/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Profile unavailable (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!data || data.message || !data._id) {
        throw new Error(data?.message || "User profile not found");
      }
      setUser(data);
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyed on the id in the URL rather than on mount, so opening one profile
  // and then another from it counts as two.
  useEffect(() => {
    track("ProfileOpened", { profileId: userId, own: userId === loggedInUserId });
  }, [userId, loggedInUserId]);

  if (isBrokenDeeplink) {
    // Empty ghost container: Missing profile feed, friends, and action buttons.
    // GhostDetector will catch this against the expected floor and record the replay!
    return (
      <Box minHeight="100vh" backgroundColor={palette.background.default}>
        <Navbar />
        <Box
          width="100%"
          padding="4rem 6%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            p="3rem"
            backgroundColor={palette.background.alt}
            borderRadius="1rem"
            textAlign="center"
            maxWidth="480px"
            width="100%"
          >
            <Typography variant="h5" color={palette.neutral.dark} fontWeight="600" mb="1rem">
              Profile Unavailable
            </Typography>
            <Typography color={palette.neutral.medium}>
              Something went wrong while resolving this deeplink. Please check the address or try again.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Loading skeleton state (renders Navbar immediately + layout skeleton)
  if (loading) {
    return (
      <Box minHeight="100vh" backgroundColor={palette.background.default}>
        <Navbar />
        <Box
          width="100%"
          padding="2rem 6%"
          display={isNonMobileScreens ? "flex" : "block"}
          gap="2rem"
          justifyContent="center"
        >
          <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
            <WidgetWrapper>
              <Box display="flex" alignItems="center" gap="1rem" pb="1.1rem">
                <Skeleton variant="circular" width={60} height={60} />
                <Box flex={1}>
                  <Skeleton variant="text" width="70%" height={28} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
              </Box>
              <Skeleton variant="rectangular" height={1} sx={{ my: 1.5 }} />
              <Box py={1}>
                <Skeleton variant="text" width="80%" height={22} />
                <Skeleton variant="text" width="60%" height={22} />
              </Box>
            </WidgetWrapper>
            <Box m="2rem 0" />
            <WidgetWrapper>
              <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={60} sx={{ mb: 1.5 }} />
              <Skeleton variant="rounded" height={60} />
            </WidgetWrapper>
          </Box>

          <Box
            flexBasis={isNonMobileScreens ? "42%" : undefined}
            mt={isNonMobileScreens ? undefined : "2rem"}
          >
            <WidgetWrapper>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
              <Box display="flex" justifyContent="flex-end">
                <Skeleton variant="rounded" width={80} height={36} />
              </Box>
            </WidgetWrapper>
            <Box m="2rem 0" />
            <WidgetWrapper>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Skeleton variant="circular" width={44} height={44} />
                <Box flex={1}>
                  <Skeleton variant="text" width="50%" height={22} />
                  <Skeleton variant="text" width="30%" height={16} />
                </Box>
              </Box>
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="75%" height={20} />
              <Skeleton variant="rounded" height={220} sx={{ mt: 2 }} />
            </WidgetWrapper>
          </Box>
        </Box>
      </Box>
    );
  }

  // Error / Not Found fallback state
  if (error || !user) {
    return (
      <Box minHeight="100vh" backgroundColor={palette.background.default}>
        <Navbar />
        <Box
          width="100%"
          padding="4rem 6%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            p="3rem"
            backgroundColor={palette.background.alt}
            borderRadius="1rem"
            textAlign="center"
            maxWidth="520px"
            width="100%"
            boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          >
            <Typography variant="h4" color="error" fontWeight="700" mb="1rem">
              Profile Not Found
            </Typography>
            <Typography variant="body1" color={palette.neutral.medium} mb="0.5rem">
              {error || "Unable to load profile data for user ID:"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "inline-block",
                fontFamily: "monospace",
                bgcolor: palette.neutral.light,
                px: 1.5,
                py: 0.5,
                borderRadius: "4px",
                mb: "2rem",
                wordBreak: "break-all",
              }}
            >
              {userId}
            </Typography>
            <Box display="flex" gap="1rem" justifyContent="center">
              <Button
                variant="outlined"
                color="primary"
                onClick={getUser}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/home")}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Return to Feed
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={userId} picturePath={user.picturePath} />
          <Box m="2rem 0" />
          <FriendListWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <MyPostWidget picturePath={user.picturePath} />
          <Box m="2rem 0" />
          <PostsWidget userId={userId} isProfile />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
