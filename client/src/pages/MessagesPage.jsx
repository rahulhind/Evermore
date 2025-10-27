import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  useTheme,
  useMediaQuery,
  Typography, // ✅ Add this
} from "@mui/material";
import { Message as MessageIcon } from "@mui/icons-material"; // ✅ Add this
import { useSelector } from "react-redux";
import MessagesSidebar from "components/messages/MessagesSidebar";
import ChatWindow from "components/messages/ChatWindow"; // Make sure this file exists
import GroupChatWindow from "components/messages/GroupChatWindow";
import ActiveUsersSidebar from "components/messages/ActiveUsersSidebar";
import { useParams } from "react-router-dom";

const MessagesPage = () => {
  const { chatId } = useParams();
  const [chatType, setChatType] = useState("dm");
  const [selectedChat, setSelectedChat] = useState(null);
  
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const userId = useSelector((state) => state.user._id);

  useEffect(() => {
    if (chatId) {
      setSelectedChat(chatId);
    }
  }, [chatId]);

  return (
    <Box>
      <Grid container sx={{ height: "100vh" }}>
        {/* Left Sidebar - Conversations List */}
        {(isNonMobileScreens || !selectedChat) && (
          <Grid
            item
            xs={12}
            md={3}
            sx={{
              borderRight: `1px solid ${theme.palette.divider}`,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <MessagesSidebar
              onSelectChat={(id, type) => {
                setSelectedChat(id);
                setChatType(type);
              }}
              selectedChat={selectedChat}
            />
          </Grid>
        )}

        {/* Center - Chat Window */}
        <Grid
          item
          xs={12}
          md={isNonMobileScreens ? 6 : 12}
          sx={{
            height: "100vh",
            display: selectedChat || isNonMobileScreens ? "block" : "none",
          }}
        >
          {selectedChat ? (
            chatType === "dm" ? (
              <ChatWindow
                otherUserId={selectedChat}
                onBack={() => setSelectedChat(null)}
              />
            ) : (
              <GroupChatWindow
                groupId={selectedChat}
                onBack={() => setSelectedChat(null)}
              />
            )
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: theme.palette.background.default,
              }}
            >
              <Box sx={{ textAlign: "center", opacity: 0.5 }}>
                <MessageIcon sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h5">Select a conversation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a chat to start messaging
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>

        {/* Right Sidebar - Active Users */}
        {isNonMobileScreens && (
          <Grid
            item
            md={3}
            sx={{
              borderLeft: `1px solid ${theme.palette.divider}`,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <ActiveUsersSidebar
              onSelectUser={(userId) => {
                setSelectedChat(userId);
                setChatType("dm");
              }}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MessagesPage;
