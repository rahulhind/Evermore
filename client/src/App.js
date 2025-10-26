import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import MessagesPage from "pages/MessagesPage";
import { useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { host } from "hs";

// ✅ Online Status Handler Component
const OnlineStatusHandler = () => {
  const userId = useSelector((state) => state.user?._id);
  const token = useSelector((state) => state.token);

  useEffect(() => {
    // Update online status when component mounts (user is logged in)
    if (userId && token) {
      console.log("📡 Setting online status to true");
      
      fetch(`${host}users/${userId}/online-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline: true }),
      }).catch((error) => console.error("Error setting online status:", error));
    }

    // Update offline status when window closes/refreshes
    const handleBeforeUnload = () => {
      if (userId && token) {
        console.log("📡 Setting online status to false");
        
        // Use sendBeacon for reliable async request on page unload
        const blob = new Blob(
          [JSON.stringify({ isOnline: false })],
          { type: "application/json" }
        );
        
        // Fallback: try regular fetch with keepalive
        fetch(`${host}users/${userId}/online-status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isOnline: false }),
          keepalive: true, // Keeps request alive even after page unload
        }).catch(() => {
          // If fetch fails, nothing we can do
        });
      }
    };

    // Handle page visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (userId && token) {
        const isOnline = !document.hidden;
        
        fetch(`${host}users/${userId}/online-status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isOnline }),
        }).catch((error) => console.error("Error updating visibility status:", error));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, token]);

  return null; // This component doesn't render anything
};

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          
          {/* ✅ Online Status Handler - only renders when user is logged in */}
          {isAuth && <OnlineStatusHandler />}
          
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/home"
              element={isAuth ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/profile/:userId"
              element={isAuth ? <ProfilePage /> : <Navigate to="/" />}
            />
            {/* ✅ Protected Messages Routes */}
            <Route
              path="/messages"
              element={isAuth ? <MessagesPage /> : <Navigate to="/" />}
            />
            <Route
              path="/messages/:chatId"
              element={isAuth ? <MessagesPage /> : <Navigate to="/" />}
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
