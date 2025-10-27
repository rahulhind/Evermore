import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  AvatarGroup,
  Chip,
} from "@mui/material";
import {
  Send,
  Image as ImageIcon,
  EmojiEmotions,
  MoreVert,
  ArrowBack,
  Info,
  ExitToApp,
  PersonAdd,
  Settings as SettingsIcon,
  Done,
  DoneAll,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from "emoji-picker-react";

const GroupChatWindow = ({ groupId, onBack }) => {
  const [group, setGroup] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const currentUser = useSelector((state) => state.user);
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch group details
  const fetchGroup = async () => {
    try {
      const response = await fetch(`${host}groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data);
        
        // Mark messages as read
        markAsRead();
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`${host}groups/${groupId}/send`, {
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
        const updatedGroup = await response.json();
        setGroup(updatedGroup);
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
  const markAsRead = async () => {
    try {
      await fetch(`${host}groups/${groupId}/read/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      const response = await fetch(`${host}groups/${groupId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        onBack();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchGroup();
    pollingIntervalRef.current = setInterval(fetchGroup, 3000);
    
    return () => {
      clearInterval(pollingIntervalRef.current);
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [group?.messages]);

  if (loading || !group) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const isAdmin = group.admin._id === userId;

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
        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
          {group.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="600">
            {group.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {group.members.length} members
          </Typography>
        </Box>
        <IconButton onClick={() => setShowGroupInfo(true)}>
          <Info />
        </IconButton>
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MoreVert />
        </IconButton>
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
        {group.messages.map((message) => {
          const sender = group.members.find((m) => m._id === message.sender);
          const isSender = message.sender === userId;
          const isSystem = message.type === "system";

          if (isSystem) {
            return (
              <Box key={message._id} sx={{ textAlign: "center", my: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: theme.palette.action.hover,
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                  }}
                >
                  {message.content}
                </Typography>
              </Box>
            );
          }

          const hasRead = message.readBy.some((r) => r.user === userId);
          const readCount = message.readBy.length;

          return (
            <Box
              key={message._id}
              sx={{
                display: "flex",
                flexDirection: isSender ? "row-reverse" : "row",
                gap: 1,
                mb: 0.5,
              }}
            >
              {!isSender && (
                <Avatar
                  src={`https://res.cloudinary.com/dsrlvqk3i/${sender?.picturePath}`}
                  sx={{ width: 32, height: 32 }}
                />
              )}
              <Box sx={{ maxWidth: "70%" }}>
                {!isSender && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {sender?.firstName} {sender?.lastName}
                  </Typography>
                )}
                <Box
                  sx={{
                    bgcolor: message.deleted
                      ? theme.palette.action.disabledBackground
                      : isSender
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontStyle: message.deleted ? "italic" : "normal",
                      opacity: message.deleted ? 0.6 : 1,
                    }}
                  >
                    {message.content}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                    {isSender && (
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {readCount > 1 ? `• ${readCount - 1} read` : ""}
                      </Typography>
                    )}
                  </Box>
                </Box>
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
          <IconButton disabled={sending}>
            <ImageIcon />
          </IconButton>
          <IconButton
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={sending}
          >
            <EmojiEmotions />
          </IconButton>
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

        {showEmojiPicker && (
          <Box sx={{ position: "absolute", bottom: 80, right: 20 }}>
            <EmojiPicker
              onEmojiClick={(emoji) => {
                setMessageText((prev) => prev + emoji.emoji);
                setShowEmojiPicker(false);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {isAdmin && (
          <MenuItem onClick={() => setMenuAnchor(null)}>
            <PersonAdd sx={{ mr: 1 }} /> Add Members
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem onClick={() => setMenuAnchor(null)}>
            <SettingsIcon sx={{ mr: 1 }} /> Group Settings
          </MenuItem>
        )}
        <MenuItem
          onClick={handleLeaveGroup}
          sx={{ color: theme.palette.error.main }}
        >
          <ExitToApp sx={{ mr: 1 }} /> Leave Group
        </MenuItem>
      </Menu>

      {/* Group Info Dialog */}
      <Dialog
        open={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{group.name}</DialogTitle>
        <DialogContent>
          {group.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {group.description}
              </Typography>
            </Box>
          )}
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Members ({group.members.length})
          </Typography>
          <List>
            {group.members.map((member) => (
              <ListItem key={member._id}>
                <ListItemAvatar>
                  <Avatar
                    src={`https://res.cloudinary.com/dsrlvqk3i/${member.picturePath}`}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.firstName} ${member.lastName}`}
                  secondary={
                    member._id === group.admin._id ? (
                      <Chip label="Admin" size="small" color="primary" />
                    ) : member.isOnline ? (
                      <Typography variant="caption" color="success.main">
                        • Online
                      </Typography>
                    ) : null
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGroupInfo(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupChatWindow;
