import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Send,
  ArrowBack,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";
import { formatDistanceToNow } from "date-fns";

const ChatWindow = ({ otherUserId, onBack }) => {
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch or create conversation
  const fetchConversation = async () => {
    try {
      const response = await fetch(
        `${host}messages/${userId}/conversation/${otherUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversation(data);
        markAsRead(data._id);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`${host}messages/${conversation._id}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: userId,
          content: messageText.trim(),
          type: "text",
        }),
      });

      if (response.ok) {
        const updatedConv = await response.json();
        setConversation(updatedConv);
        setMessageText("");
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId) => {
    try {
      await fetch(`${host}messages/${conversationId}/read/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get other user
  const getOtherUser = () => {
    if (!conversation) return null;
    return conversation.participants.find((p) => p._id !== userId);
  };

  useEffect(() => {
    fetchConversation();
    pollingIntervalRef.current = setInterval(fetchConversation, 3000);
    
    return () => {
      clearInterval(pollingIntervalRef.current);
    };
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const otherUser = getOtherUser();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
        <Avatar
          src={`https://res.cloudinary.com/dsrlvqk3i/${otherUser?.picturePath}`}
          alt={otherUser?.firstName}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="600">
            {otherUser?.firstName} {otherUser?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {otherUser?.isOnline ? "Active now" : "Offline"}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {conversation?.messages.map((message) => {
          const isSender = message.sender === userId;

          return (
            <Box
              key={message._id}
              sx={{
                display: "flex",
                justifyContent: isSender ? "flex-end" : "flex-start",
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  maxWidth: "70%",
                  bgcolor: isSender
                    ? theme.palette.primary.main
                    : theme.palette.background.paper,
                  color: isSender
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                  borderRadius: 2,
                  p: 1.5,
                  boxShadow: 1,
                }}
              >
                <Typography variant="body2">
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow;
