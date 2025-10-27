import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  TextField,
  useTheme,
  Badge,
  Popover,
  Grid,
} from "@mui/material";
import {
  Close,
  Remove,
  Send,
  EmojiEmotions,
  Image as ImageIcon,
  InsertEmoticon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";

const FloatingChatWindow = ({ 
  friend, 
  group, 
  onClose, 
  onMinimize, 
  position, 
  isGroup = false 
}) => {
  // States
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stickerAnchor, setStickerAnchor] = useState(null);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  // Selectors
  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Stickers
  const stickers = [
    "👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉",
    "🔥", "💯", "✨", "🌟", "💪", "🙏", "🤔", "😎"
  ];

  // Simple emoji list (no library needed)
  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
    "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😗",
    "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
    "😎", "🤓", "😏", "😒", "😞", "😔", "😟", "😕",
    "😭", "😢", "😥", "😰", "😨", "😱", "😡", "😠",
    "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘",
    "🔥", "✨", "💫", "⭐", "🌟", "💯", "🎉", "🎊"
  ];

  // Fetch conversation
  const fetchConversation = async () => {
    try {
      let response;
      if (isGroup) {
        response = await fetch(`${host}groups/${group._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await fetch(
          `${host}messages/${userId}/conversation/${friend._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setConversation(data);
        if (!isGroup) {
          markAsRead(data._id);
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (type = "text", content = messageText) => {
    if (!content.trim() || !conversation) return;

    try {
      let response;
      if (isGroup) {
        response = await fetch(`${host}groups/${group._id}/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: userId,
            content: content.trim(),
            type,
          }),
        });
      } else {
        response = await fetch(`${host}messages/${conversation._id}/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: userId,
            content: content.trim(),
            type,
          }),
        });
      }

      if (response.ok) {
        const updatedConv = await response.json();
        setConversation(updatedConv);
        setMessageText("");
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Send image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !conversation) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("senderId", userId);

    try {
      const response = await fetch(
        `${host}messages/${conversation._id}/send-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (response.ok) {
        const updatedConv = await response.json();
        setConversation(updatedConv);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };

  // Send sticker/emoji
  const handleQuickReaction = (reaction) => {
    sendMessage("text", reaction);
    setStickerAnchor(null);
    setEmojiAnchor(null);
  };

  // Mark as read
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

  // Effects
  useEffect(() => {
    fetchConversation();
    pollingRef.current = setInterval(fetchConversation, 3000);
    return () => clearInterval(pollingRef.current);
  }, [friend?._id, group?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Handlers
  const handleMinimize = () => {
    setMinimized(!minimized);
    if (onMinimize) onMinimize();
  };

  // Data
  const chatName = isGroup ? group.name : `${friend.firstName} ${friend.lastName}`;
  const chatAvatar = isGroup ? null : friend.picturePath;
  const isOnline = isGroup ? false : friend.isOnline;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        right: (position + 1) * 330 + 20,
        width: 320,
        height: minimized ? 56 : 450,
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px 8px 0 0",
        overflow: "hidden",
        zIndex: 1300,
        transition: "height 0.2s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: theme.palette.primary.main,
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
        }}
        onClick={handleMinimize}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: isOnline ? "#44b700" : "gray",
              width: 10,
              height: 10,
            },
          }}
        >
          <Avatar
            src={chatAvatar ? `https://res.cloudinary.com/dsrlvqk3i/${chatAvatar}` : null}
            sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}
          >
            {!chatAvatar && chatName.charAt(0)}
          </Avatar>
        </Badge>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="600">
            {chatName}
          </Typography>
          <Typography variant="caption">
            {isGroup 
              ? `${group.members?.length || 0} members` 
              : (isOnline ? "Active now" : "Offline")
            }
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: "white" }} onClick={handleMinimize}>
          <Remove />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: "white" }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Messages */}
      {!minimized && (
        <>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 1.5,
              bgcolor: theme.palette.background.default,
            }}
          >
            {loading ? (
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            ) : conversation?.messages.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start the conversation!
                </Typography>
              </Box>
            ) : (
              conversation?.messages.map((message) => {
                const isSender = message.sender === userId || message.sender._id === userId;
                const isImageMsg = message.type === "image";
                
                return (
                  <Box
                    key={message._id}
                    sx={{
                      display: "flex",
                      justifyContent: isSender ? "flex-end" : "flex-start",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "70%",
                        bgcolor: isSender
                          ? theme.palette.primary.main
                          : theme.palette.grey[300],
                        color: isSender ? "white" : "black",
                        borderRadius: 2,
                        px: isImageMsg ? 0.5 : 1.5,
                        py: isImageMsg ? 0.5 : 0.75,
                      }}
                    >
                      {isImageMsg ? (
                        <img
                          src={`https://res.cloudinary.com/dsrlvqk3i/${message.imageUrl}`}
                          alt="Shared"
                          style={{
                            maxWidth: "100%",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Typography variant="body2">{message.content}</Typography>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 1,
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Image Upload */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
            >
              <ImageIcon fontSize="small" />
            </IconButton>

            {/* Stickers */}
            <IconButton
              size="small"
              onClick={(e) => setStickerAnchor(e.currentTarget)}
              title="Quick reactions"
            >
              <InsertEmoticon fontSize="small" />
            </IconButton>

            {/* Emojis */}
            <IconButton
              size="small"
              onClick={(e) => setEmojiAnchor(e.currentTarget)}
              title="Emojis"
            >
              <EmojiEmotions fontSize="small" />
            </IconButton>

            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 20,
                },
              }}
            />
            <IconButton
              size="small"
              color="primary"
              onClick={() => sendMessage()}
              disabled={!messageText.trim()}
              title="Send message"
            >
              <Send fontSize="small" />
            </IconButton>
          </Box>

          {/* Emoji Picker Popover */}
          <Popover
            open={Boolean(emojiAnchor)}
            anchorEl={emojiAnchor}
            onClose={() => setEmojiAnchor(null)}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <Box sx={{ p: 2, width: 280, maxHeight: 300, overflow: "auto" }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mb: 1, display: "block" }}
              >
                Select Emoji
              </Typography>
              <Grid container spacing={0.5}>
                {emojis.map((emoji, index) => (
                  <Grid item key={index}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuickReaction(emoji)}
                      sx={{
                        fontSize: "1.3rem",
                        padding: "4px",
                        "&:hover": {
                          transform: "scale(1.2)",
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      {emoji}
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Popover>

          {/* Sticker Menu */}
          <Popover
            open={Boolean(stickerAnchor)}
            anchorEl={stickerAnchor}
            onClose={() => setStickerAnchor(null)}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <Box sx={{ p: 2, width: 250 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mb: 1, display: "block" }}
              >
                Quick Reactions
              </Typography>
              <Grid container spacing={1}>
                {stickers.map((sticker, index) => (
                  <Grid item xs={3} key={index}>
                    <IconButton
                      onClick={() => handleQuickReaction(sticker)}
                      sx={{
                        fontSize: "2rem",
                        "&:hover": {
                          transform: "scale(1.2)",
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      {sticker}
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Popover>
        </>
      )}
    </Paper>
  );
};

export default FloatingChatWindow;
