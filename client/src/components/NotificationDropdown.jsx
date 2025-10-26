import { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Divider,
  useTheme,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  Notifications,
  Close,
  Security,
  Campaign,
  EmojiEvents,
  Group,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { host } from "hs";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const token = useSelector((state) => state.token);
  const userId = useSelector((state) => state.user._id);
  const theme = useTheme();
  const navigate = useNavigate();

  const intervalRef = useRef(null);

  // Category icons
  const categoryIcons = {
    social: "👥",
    security: "🔐",
    promotion: "📢",
    suggestion: "💡",
    achievement: "🏆",
    system: "⚙️",
    group: "👥",
  };

  // Fetch notifications
  const fetchNotifications = async (category = "all") => {
    try {
      const url =
        category === "all"
          ? `${host}notifications/${userId}`
          : `${host}notifications/${userId}?category=${category}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setCategoryCounts(data.categoryCounts || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `${host}notifications/${userId}/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [userId]);

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    await fetchNotifications(selectedCategory);
    setLoading(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCategoryChange = async (event, newValue) => {
    setSelectedCategory(newValue);
    setLoading(true);
    await fetchNotifications(newValue);
    setLoading(false);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as clicked
      await fetch(`${host}notifications/${notification._id}/clicked`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Navigate if link exists
      if (notification.link) {
        navigate(notification.link);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true, clicked: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      handleClose();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleActionClick = async (notification, action) => {
    try {
      if (action.action === "navigate") {
        navigate(action.value);
      } else if (action.action === "api_call") {
        // Handle API call
        await fetch(`${host}${action.value}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId: notification._id }),
        });
      } else if (action.action === "dismiss") {
        await handleDismiss(notification._id);
      }

      handleClose();
    } catch (error) {
      console.error("Error handling action:", error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await fetch(`${host}notifications/${notificationId}/dismiss`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return theme.palette.error.main;
      case "high":
        return theme.palette.warning.main;
      case "medium":
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications sx={{ fontSize: "25px" }} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box
          sx={{
            width: 400,
            maxHeight: 600,
            bgcolor: theme.palette.background.default,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight="600">
              Notifications
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>

          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="All" value="all" />
            {categoryCounts.map((cat) => (
              <Tab
                key={cat._id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {categoryIcons[cat._id]}
                    <Badge badgeContent={cat.count} color="primary" />
                  </Box>
                }
                value={cat._id}
              />
            ))}
          </Tabs>

          {/* Notifications list */}
          {loading ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 450, overflow: "auto" }}>
              {notifications.map((notification) => (
                <Box key={notification._id}>
                  <ListItem
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      bgcolor: notification.read
                        ? "transparent"
                        : theme.palette.action.hover,
                      borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                      "&:hover": {
                        bgcolor: theme.palette.action.selected,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <ListItemAvatar>
                        {notification.sender ? (
                          <Avatar
                            src={`https://res.cloudinary.com/dsrlvqk3i/${notification.sender.picturePath}`}
                          />
                        ) : (
                          <Avatar>{notification.icon}</Avatar>
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <>
                            {notification.title && (
                              <Typography variant="subtitle2" fontWeight="600">
                                {notification.title}
                              </Typography>
                            )}
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? "400" : "600"}
                            >
                              {notification.message}
                            </Typography>
                          </>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </Typography>
                            <Chip
                              label={notification.category}
                              size="small"
                              sx={{ height: 16, fontSize: "0.65rem" }}
                            />
                          </Box>
                        }
                      />
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Box>

                    {/* Action Buttons */}
                    {notification.actions && notification.actions.length > 0 && (
                      <Box sx={{ display: "flex", gap: 1, mt: 1, width: "100%" }}>
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="small"
                            variant={
                              action.style === "primary" ? "contained" : "outlined"
                            }
                            color={action.style === "danger" ? "error" : "primary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(notification, action);
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Box>
                    )}
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationDropdown;
