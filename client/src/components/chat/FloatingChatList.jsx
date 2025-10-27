import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { Search, Close, Circle, Group as GroupIcon, Add } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";

const FloatingChatList = ({ onClose, onSelectFriend, onSelectGroup, onCreateGroup }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Friends, 1: Groups
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineFriends, setOnlineFriends] = useState([]);
  
  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();

  // Fetch friends
  const fetchFriends = async () => {
    try {
      const response = await fetch(`${host}users/${userId}/all-friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        setOnlineFriends(data.filter(f => f.isOnline));
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
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

  useEffect(() => {
    fetchFriends();
    fetchGroups();
    const interval = setInterval(() => {
      fetchFriends();
      fetchGroups();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredFriends = friends.filter((friend) =>
    `${friend.firstName} ${friend.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayList = activeTab === 0 ? filteredFriends : filteredGroups;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        right: 20,
        width: 320,
        height: 500,
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px 8px 0 0",
        overflow: "hidden",
        zIndex: 1300,
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
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Contacts
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {activeTab === 1 && (
            <IconButton size="small" onClick={onCreateGroup} sx={{ color: "white" }}>
              <Add />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab label="Friends" />
        <Tab label="Groups" />
      </Tabs>

      {/* Search */}
      <Box sx={{ p: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={activeTab === 0 ? "Search friends..." : "Search groups..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Online Count (Friends only) */}
      {activeTab === 0 && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {onlineFriends.length} online
          </Typography>
        </Box>
      )}

      <Divider />

      {/* List */}
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {displayList.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 ? "No friends found" : "No groups yet"}
            </Typography>
            {activeTab === 1 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={onCreateGroup}
                sx={{ mt: 2 }}
              >
                Create Group
              </Button>
            )}
          </Box>
        ) : activeTab === 0 ? (
          // Friends List
          filteredFriends.map((friend) => (
            <ListItem
              key={friend._id}
              button
              onClick={() => {
                console.log("💬 Opening chat with:", friend);
                onSelectFriend(friend);
              }}
              sx={{
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    friend.isOnline ? (
                      <Circle
                        sx={{
                          fontSize: 12,
                          color: "#44b700",
                          bgcolor: "white",
                          borderRadius: "50%",
                        }}
                      />
                    ) : null
                  }
                >
                  <Avatar
                    src={`https://res.cloudinary.com/dsrlvqk3i/${friend.picturePath}`}
                    sx={{ width: 40, height: 40 }}
                  />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={`${friend.firstName} ${friend.lastName}`}
                primaryTypographyProps={{ variant: "body2" }}
                secondary={friend.isOnline ? "Active now" : "Offline"}
                secondaryTypographyProps={{
                  variant: "caption",
                  color: friend.isOnline ? "success.main" : "text.secondary",
                }}
              />
            </ListItem>
          ))
        ) : (
          // Groups List
          filteredGroups.map((group) => (
            <ListItem
              key={group._id}
              button
              onClick={() => {
                console.log("💬 Opening group chat:", group);
                onSelectGroup(group);
              }}
              sx={{
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  <GroupIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={group.name}
                primaryTypographyProps={{ variant: "body2" }}
                secondary={`${group.members?.length || 0} members`}
                secondaryTypographyProps={{
                  variant: "caption",
                  color: "text.secondary",
                }}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default FloatingChatList;
