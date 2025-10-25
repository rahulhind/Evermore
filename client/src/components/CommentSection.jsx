import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Button,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  FavoriteBorderOutlined,
  FavoriteOutlined,
  MoreVert,
  Edit,
  Delete,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";

const Comment = ({
  comment,
  loggedInUserId,
  loggedInUser,
  onCommentAction,
  depth = 0,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const primary = palette.primary.main;

  const isCommentOwner = comment.userId === loggedInUserId;
  const isLiked = comment.likes?.hasOwnProperty(loggedInUserId);
  const likeCount = comment.likes ? Object.keys(comment.likes).length : 0;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    onCommentAction("reply", comment._id, { content: replyText.trim() });
    setReplyText("");
    setIsReplying(false);
    setShowReplies(true);
  };

  const handleEdit = () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }
    onCommentAction("edit", comment._id, { content: editText.trim() });
    setIsEditing(false);
    handleMenuClose();
  };

  const handleDelete = () => {
    onCommentAction("delete", comment._id);
    handleMenuClose();
  };

  const handleLike = () => {
    onCommentAction("like", comment._id);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <Box sx={{ mb: depth === 0 ? "1rem" : "0.5rem" }}>
      <Box sx={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        {/* Avatar */}
        <Avatar
          src={`https://res.cloudinary.com/dsrlvqk3i/${comment.userPicturePath}`}
          sx={{ width: depth > 0 ? 28 : 32, height: depth > 0 ? 28 : 32 }}
        />

        <Box sx={{ flex: 1 }}>
          {/* Comment content */}
          <Box
            sx={{
              backgroundColor: palette.neutral.light,
              borderRadius: "1rem",
              padding: "0.5rem 0.75rem",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="600"
              sx={{ fontSize: depth > 0 ? "0.8rem" : "0.85rem" }}
            >
              {comment.firstName} {comment.lastName}
            </Typography>

            {isEditing ? (
              <Box sx={{ mt: "0.25rem" }}>
                <InputBase
                  fullWidth
                  multiline
                  maxRows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  sx={{
                    fontSize: "0.85rem",
                    backgroundColor: palette.background.default,
                    borderRadius: "0.5rem",
                    padding: "0.25rem 0.5rem",
                  }}
                />
                <Box sx={{ display: "flex", gap: "0.5rem", mt: "0.5rem" }}>
                  <Button
                    size="small"
                    onClick={handleEdit}
                    sx={{
                      fontSize: "0.7rem",
                      textTransform: "none",
                      color: primary,
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    sx={{
                      fontSize: "0.7rem",
                      textTransform: "none",
                      color: medium,
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  mt: "0.25rem",
                  fontSize: depth > 0 ? "0.8rem" : "0.85rem",
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                }}
              >
                {comment.content}
              </Typography>
            )}
          </Box>

          {/* Action buttons */}
          {!isEditing && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                mt: "0.25rem",
                ml: "0.75rem",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: medium, fontSize: "0.75rem" }}
              >
                {formatTimeAgo(comment.createdAt)}
              </Typography>

              <Typography
                variant="caption"
                onClick={handleLike}
                sx={{
                  color: isLiked ? primary : medium,
                  fontSize: "0.75rem",
                  fontWeight: isLiked ? "600" : "500",
                  cursor: "pointer",
                  "&:hover": { color: primary },
                }}
              >
                Like {likeCount > 0 && `(${likeCount})`}
              </Typography>

              {depth < 2 && (
                <Typography
                  variant="caption"
                  onClick={() => setIsReplying(!isReplying)}
                  sx={{
                    color: medium,
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    "&:hover": { color: primary },
                  }}
                >
                  Reply
                </Typography>
              )}

              {hasReplies && (
                <Typography
                  variant="caption"
                  onClick={() => setShowReplies(!showReplies)}
                  sx={{
                    color: primary,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {showReplies ? "Hide" : "View"} {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </Typography>
              )}

              {isCommentOwner && (
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ p: 0, ml: "auto" }}
                >
                  <MoreVert sx={{ fontSize: "1rem" }} />
                </IconButton>
              )}
            </Box>
          )}

          {/* Reply input */}
          {isReplying && (
            <Box
              sx={{ display: "flex", gap: "0.5rem", mt: "0.5rem", ml: "0.5rem" }}
            >
              <Avatar
                src={`https://res.cloudinary.com/dsrlvqk3i/${loggedInUser.picturePath}`}
                sx={{ width: 24, height: 24 }}
              />
              <InputBase
                placeholder={`Reply to ${comment.firstName}...`}
                multiline
                maxRows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                sx={{
                  flex: 1,
                  backgroundColor: palette.neutral.light,
                  borderRadius: "1rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8rem",
                }}
              />
              <Button
                size="small"
                disabled={!replyText.trim()}
                onClick={handleReply}
                sx={{
                  fontSize: "0.7rem",
                  textTransform: "none",
                  color: primary,
                }}
              >
                Reply
              </Button>
            </Box>
          )}

          {/* Nested replies */}
          {showReplies && hasReplies && (
            <Box sx={{ ml: "0.5rem", mt: "0.75rem" }}>
              {comment.replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  loggedInUserId={loggedInUserId}
                  loggedInUser={loggedInUser}
                  onCommentAction={onCommentAction}
                  depth={depth + 1}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Menu for edit/delete */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setIsEditing(true);
            handleMenuClose();
          }}
        >
          <Edit sx={{ fontSize: "1rem", mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <Delete sx={{ fontSize: "1rem", mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

const CommentSection = ({
  comments,
  loggedInUserId,
  loggedInUser,
  onCommentAction,
}) => {
  return (
    <Box>
      {comments.map((comment) => (
        <Comment
          key={comment._id}
          comment={comment}
          loggedInUserId={loggedInUserId}
          loggedInUser={loggedInUser}
          onCommentAction={onCommentAction}
        />
      ))}
    </Box>
  );
};

export default CommentSection;