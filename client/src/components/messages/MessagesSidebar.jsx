import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  IconButton,
  Button,
  useTheme,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Add,
  Group as GroupIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";
import { formatDistanceToNow } from "date-fns";
import CreateGroupDialog from "./CreateGroupDialog";

const MessagesSidebar = ({ onSelectChat, selectedChat }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: DMs, 1: Groups, 2: Friends
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${host}messages/${userId}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await fetch(`${host}groups/${userId}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // ✅ NEW: Fetch all friends
  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      console.log("👥 Fetching friends for user:", userId);
      const response = await fetch(`${host}users/${userId}/all-friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Friends data:", data);
        setFriends(data);
      } else {
        console.error("❌ Failed to fetch friends:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchGroups();
    fetchFriends(); // ✅ Fetch friends on mount
    
    const interval = setInterval(() => {
      fetchConversations();
      fetchGroups();
      if (activeTab === 2) {
        fetchFriends(); // Refresh friends list when on that tab
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userId, activeTab]);

  const filteredConversations = conversations.filter((conv) =>
    conv.otherParticipant?.firstName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    conv.otherParticipant?.lastName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ NEW: Filter friends
  const filteredFriends = friends.filter((friend) =>
    friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Determine what to display based on active tab
  const displayList = 
    activeTab === 0 ? filteredConversations : 
    activeTab === 1 ? filteredGroups : 
    filteredFriends;

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
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5" fontWeight="700">
            Chats
          </Typography>
          <IconButton
            onClick={() => setOpenCreateGroup(true)}
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: "white",
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}
          >
            <Add />
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder={
            activeTab === 0 ? "Search messages..." :
            activeTab === 1 ? "Search groups..." :
            "Search friends..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 20,
              bgcolor: theme.palette.background.paper,
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab
          label={
            <Badge badgeContent={conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} color="error">
              Chats
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0)} color="error">
              Groups
            </Badge>
          }
        />
        {/* ✅ NEW: Friends Tab */}
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PeopleIcon sx={{ fontSize: 18 }} />
              Friends
            </Box>
          }
        />
      </Tabs>

      {/* List Display */}
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {loadingFriends && activeTab === 2 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress size={30} />
          </Box>
        ) : displayList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            {activeTab === 0 ? (
              <>
                <MessageIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography color="text.secondary">No messages yet</Typography>
                <Typography variant="caption" color="text.secondary">
                  Click on a friend to start chatting
                </Typography>
              </>
            ) : activeTab === 1 ? (
              <>
                <GroupIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography color="text.secondary">No groups yet</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenCreateGroup(true)}
                  sx={{ mt: 2 }}
                >
                  Create Group
                </Button>
              </>
            ) : (
              <>
                <PeopleIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography color="text.secondary">No friends yet</Typography>
                <Typography variant="caption" color="text.secondary">
                  Add friends from their profile page
                </Typography>
              </>
            )}
          </Box>
        ) : (
          displayList.map((item, index) => {
            const isGroup = activeTab === 1;
            const isFriend = activeTab === 2;
            
            // For friends tab, use friend's ID directly
            // For messages/groups, use existing logic
            const chatId = isFriend ? item._id : (isGroup ? item._id : item.otherParticipant?._id);
            const isSelected = selectedChat === chatId;
            const isUnread = item.unreadCount > 0;

            // For friends tab, display differently
            if (isFriend) {
              return (
                <Box key={item._id}>
                  <ListItem
                    button
                    onClick={() => {
                      console.log("🎯 Starting chat with friend:", item._id);
                      onSelectChat(item._id, "dm");
                    }}
                    sx={{
                      bgcolor: isSelected ? theme.palette.action.selected : "transparent",
                      "&:hover": {
                        bgcolor: theme.palette.action.selected,
                      },
                      py: 1.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        variant="dot"
                        sx={{
                          "& .MuiBadge-badge": {
                            backgroundColor: item.isOnline ? "#44b700" : "#gray",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.palette.background.paper}`,
                          },
                        }}
                      >
                        <Avatar
                          src={`https://res.cloudinary.com/dsrlvqk3i/${item.picturePath}`}
                          sx={{ width: 50, height: 50 }}
                        />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="500">
                          {item.firstName} {item.lastName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color={item.isOnline ? "success.main" : "text.secondary"}>
                          {item.isOnline ? "• Active now" : "Offline"}
                        </Typography>
                      }
                    />
                    <IconButton size="small" color="primary">
                      <ChatIcon />
                    </IconButton>
                  </ListItem>
                  {index < displayList.length - 1 && <Divider />}
                </Box>
              );
            }

            // Original display for messages and groups
            return (
              <Box key={item._id}>
                <ListItem
                  button
                  onClick={() => onSelectChat(chatId, isGroup ? "group" : "dm")}
                  sx={{
                    bgcolor: isSelected
                      ? theme.palette.action.selected
                      : isUnread
                      ? theme.palette.action.hover
                      : "transparent",
                    "&:hover": {
                      bgcolor: theme.palette.action.selected,
                    },
                    py: 1.5,
                  }}
                >
                  <ListItemAvatar>
                    {isGroup ? (
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          width: 50,
                          height: 50,
                        }}
                      >
                        <GroupIcon />
                      </Avatar>
                    ) : (
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        variant="dot"
                        sx={{
                          "& .MuiBadge-badge": {
                            backgroundColor: item.otherParticipant?.isOnline
                              ? "#44b700"
                              : "transparent",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.palette.background.paper}`,
                          },
                        }}
                      >
                        <Avatar
                          src={`https://res.cloudinary.com/dsrlvqk3i/${item.otherParticipant?.picturePath}`}
                          sx={{ width: 50, height: 50 }}
                        />
                      </Badge>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        fontWeight={isUnread ? "600" : "400"}
                        noWrap
                      >
                        {isGroup
                          ? item.name
                          : `${item.otherParticipant?.firstName} ${item.otherParticipant?.lastName}`}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            fontWeight: isUnread ? "500" : "400",
                          }}
                        >
                          {item.isTyping ? (
                            <span style={{ color: theme.palette.success.main }}>
                              Typing...
                            </span>
                          ) : (
                            item.lastMessage || "Start conversation"
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                          {formatDistanceToNow(new Date(item.lastMessageAt), {
                            addSuffix: false,
                          }).replace("about ", "")}
                        </Typography>
                      </Box>
                    }
                  />
                  {isUnread && (
                    <Badge
                      badgeContent={item.unreadCount}
                      color="primary"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontWeight: "600",
                        },
                      }}
                    />
                  )}
                </ListItem>
                {index < displayList.length - 1 && <Divider />}
              </Box>
            );
          })
        )}
      </List>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        onGroupCreated={fetchGroups}
      />
    </Box>
  );
};

export default MessagesSidebar;
