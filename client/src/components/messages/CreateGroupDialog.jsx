import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Avatar,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  Chip,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Search, Group as GroupIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";

const CreateGroupDialog = ({ open, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();

  // Fetch all friends
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${host}users/${userId}/all-friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  const handleToggleMember = (friendId) => {
    setSelectedMembers((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      alert("Group name and at least 2 members are required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${host}groups/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: userId,
          name: groupName.trim(),
          description: groupDescription.trim(),
          memberIds: selectedMembers,
        }),
      });

      if (response.ok) {
        onGroupCreated();
        handleClose();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers([]);
    setSearchQuery("");
    onClose();
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupIcon color="primary" />
          <Typography variant="h6">Create New Group</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Group Name */}
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          sx={{ mb: 2 }}
          required
        />

        {/* Group Description */}
        <TextField
          fullWidth
          label="Description (Optional)"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="What's this group about?"
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        {/* Selected Members Chips */}
        {selectedMembers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              Selected ({selectedMembers.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {selectedMembers.map((memberId) => {
                const member = friends.find((f) => f._id === memberId);
                return (
                  <Chip
                    key={memberId}
                    avatar={
                      <Avatar
                        src={`https://res.cloudinary.com/dsrlvqk3i/${member?.picturePath}`}
                      />
                    }
                    label={`${member?.firstName} ${member?.lastName}`}
                    onDelete={() => handleToggleMember(memberId)}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Search Friends */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Friends List */}
        <Box
          sx={{
            maxHeight: 300,
            overflow: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          {loading ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : filteredFriends.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                {searchQuery ? "No friends found" : "No friends to add"}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredFriends.map((friend) => (
                <ListItem
                  key={friend._id}
                  disablePadding
                  secondaryAction={
                    <Checkbox
                      checked={selectedMembers.includes(friend._id)}
                      onChange={() => handleToggleMember(friend._id)}
                    />
                  }
                >
                  <ListItemButton
                    onClick={() => handleToggleMember(friend._id)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={`https://res.cloudinary.com/dsrlvqk3i/${friend.picturePath}`}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${friend.firstName} ${friend.lastName}`}
                      secondary={
                        friend.isOnline ? (
                          <Typography variant="caption" color="success.main">
                            • Online
                          </Typography>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreateGroup}
          disabled={
            creating || !groupName.trim() || selectedMembers.length < 2
          }
          startIcon={creating ? <CircularProgress size={16} /> : <GroupIcon />}
        >
          {creating ? "Creating..." : "Create Group"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupDialog;
