import { useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Search, PersonAdd } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";

const FriendSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const currentFriends = useSelector((state) => state.user.friends) || [];

  // Search users
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search all users
      const response = await fetch(`${host}users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const users = await response.json();
        // Filter out self and existing friends
        const filtered = users.filter(
          (user) =>
            user._id !== userId &&
            !currentFriends.some((f) => f._id === user._id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add friend
  const handleAddFriend = async (friendId) => {
    try {
      const response = await fetch(`${host}users/${userId}/${friendId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Friend added!");
        setSearchResults((prev) => prev.filter((u) => u._id !== friendId));
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Find Friends
      </Typography>
      
      <TextField
        fullWidth
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {loading && (
        <Box sx={{ textAlign: "center", p: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}

      {searchResults.length > 0 ? (
        <List>
          {searchResults.map((user) => (
            <ListItem
              key={user._id}
              secondaryAction={
                <Button
                  startIcon={<PersonAdd />}
                  onClick={() => handleAddFriend(user._id)}
                  variant="outlined"
                  size="small"
                >
                  Add
                </Button>
              }
            >
              <ListItemAvatar>
                <Avatar
                  src={`https://res.cloudinary.com/dsrlvqk3i/${user.picturePath}`}
                />
              </ListItemAvatar>
              <ListItemText
                primary={`${user.firstName} ${user.lastName}`}
                secondary={user.occupation}
              />
            </ListItem>
          ))}
        </List>
      ) : searchQuery.length >= 2 && !loading ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", p: 2 }}>
          No users found
        </Typography>
      ) : null}
    </Box>
  );
};

export default FriendSearch;
