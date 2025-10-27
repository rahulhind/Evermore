import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  useTheme,
  Divider,
} from "@mui/material";
import { FiberManualRecord } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { host } from "hs";

const ActiveUsersSidebar = ({ onSelectUser }) => {
  const [onlineFriends, setOnlineFriends] = useState([]);
  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();

  // Fetch online friends
  const fetchOnlineFriends = async () => {
    try {
      const response = await fetch(`${host}users/${userId}/online-friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOnlineFriends(data);
      }
    } catch (error) {
      console.error("Error fetching online friends:", error);
    }
  };

  useEffect(() => {
    fetchOnlineFriends();
    const interval = setInterval(fetchOnlineFriends, 10000);
    return () => clearInterval(interval);
  }, [userId]);

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
        <Typography variant="h6" fontWeight="600">
          Active Now ({onlineFriends.length})
        </Typography>
      </Box>

      {/* Online Friends List */}
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {onlineFriends.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No friends online
            </Typography>
          </Box>
        ) : (
          onlineFriends.map((friend, index) => (
            <Box key={friend._id}>
              <ListItem
                button
                onClick={() => onSelectUser(friend._id)}
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
                      <FiberManualRecord
                        sx={{
                          color: "#44b700",
                          fontSize: 14,
                          border: `2px solid ${theme.palette.background.paper}`,
                          borderRadius: "50%",
                        }}
                      />
                    }
                  >
                    <Avatar
                      src={`https://res.cloudinary.com/dsrlvqk3i/${friend.picturePath}`}
                      sx={{ width: 40, height: 40 }}
                    />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="500">
                      {friend.firstName} {friend.lastName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="success.main">
                      • Active now
                    </Typography>
                  }
                />
              </ListItem>
              {index < onlineFriends.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </List>
    </Box>
  );
};

export default ActiveUsersSidebar;
