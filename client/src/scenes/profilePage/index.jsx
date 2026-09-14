import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { host } from "hs";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";
import { track } from "spectra";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const { userId } = useParams();
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
      return;
    }
    const response = await fetch(`${host}users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  useEffect(() => {
    getUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!user) return null;

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
