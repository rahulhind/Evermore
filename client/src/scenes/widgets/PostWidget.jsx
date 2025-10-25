import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
  Button,
  InputBase,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import CommentSection from "components/CommentSection";
import { host } from "hs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  comments,
}) => {
  console.log("🎨 PostWidget rendered with:", {
    postId,
    postUserId,
    commentsCount: comments?.length || 0,
    likesCount: likes ? Object.keys(likes).length : 0,
  });

  const [commentText, setCommentText] = useState("");
  const [isComments, setIsComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const loggedInUser = useSelector((state) => state.user);
  
  console.log("🔑 Auth info:", {
    hasToken: !!token,
    tokenLength: token?.length,
    loggedInUserId,
    host,
  });

  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  // Like post
  const patchLike = async () => {
    console.log("❤️ patchLike called");
    const url = `${host}posts/${postId}/like`;
    console.log("🔵 URL:", url);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);

      const updatedPost = await response.json();
      console.log("✅ Post liked/unliked successfully");
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("❌ Error in patchLike:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  };

  // Add comment
  const handleAddComment = async () => {
    console.log("=".repeat(60));
    console.log("💬 handleAddComment called");
    console.log("Comment text:", commentText);
    console.log("Trimmed:", commentText.trim());

    if (!commentText.trim()) {
      console.log("⚠️ Empty comment, returning");
      return;
    }

    setIsSubmitting(true);

    const url = `${host}posts/${postId}/comment`;
    const requestBody = {
      userId: loggedInUserId,
      content: commentText.trim(),
    };

    console.log("🔵 POST Request:");
    console.log("  URL:", url);
    console.log("  Body:", JSON.stringify(requestBody, null, 2));
    console.log("  Token (first 20 chars):", token?.substring(0, 20) + "...");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response received:");
      console.log("  Status:", response.status);
      console.log("  Status Text:", response.statusText);
      console.log("  OK:", response.ok);

      if (response.ok) {
        const updatedPost = await response.json();
        console.log("✅ Comment added successfully");
        console.log("  New comments count:", updatedPost.comments?.length);
        dispatch(setPost({ post: updatedPost }));
        setCommentText("");
      } else {
        // Log error response
        const errorText = await response.text();
        console.error("❌ Server returned error:");
        console.error("  Status:", response.status);
        console.error("  Response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error("  Error JSON:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error("  Raw response:", errorText);
        }
      }
    } catch (error) {
      console.error("❌ Error in handleAddComment:");
      console.error("  Error type:", error.constructor.name);
      console.error("  Error message:", error.message);
      console.error("  Error stack:", error.stack);
    } finally {
      setIsSubmitting(false);
      console.log("=".repeat(60));
    }
  };

  // Handle comment actions (edit, delete, like, reply)
  const handleCommentAction = async (action, commentId, data = {}) => {
    console.log("=".repeat(60));
    console.log(`🔧 handleCommentAction called: ${action.toUpperCase()}`);
    console.log("  Comment ID:", commentId);
    console.log("  Additional data:", JSON.stringify(data, null, 2));

    try {
      let response;
      let url;
      let method;
      let body;
      
      switch (action) {
        case "delete":
          url = `${host}posts/${postId}/comment/${commentId}`;
          method = "DELETE";
          body = { userId: loggedInUserId };
          console.log(`🗑️ DELETE request to: ${url}`);
          
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          break;

        case "edit":
          url = `${host}posts/${postId}/comment/${commentId}`;
          method = "PATCH";
          body = {
            userId: loggedInUserId,
            content: data.content,
          };
          console.log(`✏️ PATCH request to: ${url}`);
          console.log("  Body:", JSON.stringify(body, null, 2));
          
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          break;

        case "like":
          url = `${host}posts/${postId}/comment/${commentId}/like`;
          method = "PATCH";
          body = { userId: loggedInUserId };
          console.log(`❤️ PATCH request to: ${url}`);
          console.log("  Body:", JSON.stringify(body, null, 2));
          
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          break;

        case "reply":
          url = `${host}posts/${postId}/comment/${commentId}/reply`;
          method = "POST";
          body = {
            userId: loggedInUserId,
            content: data.content,
          };
          console.log(`💬 POST request to: ${url}`);
          console.log("  Body:", JSON.stringify(body, null, 2));
          
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          break;

        default:
          console.log("⚠️ Unknown action:", action);
          return;
      }

      console.log("📥 Response received:");
      console.log("  Status:", response.status);
      console.log("  Status Text:", response.statusText);
      console.log("  OK:", response.ok);

      if (response.ok) {
        const updatedPost = await response.json();
        console.log(`✅ ${action.toUpperCase()} successful`);
        console.log("  Comments count:", updatedPost.comments?.length);
        dispatch(setPost({ post: updatedPost }));
      } else {
        // Log error response
        const errorText = await response.text();
        console.error(`❌ ${action.toUpperCase()} failed:`);
        console.error("  Status:", response.status);
        console.error("  Response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error("  Error JSON:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error("  Raw response:", errorText);
        }
      }
    } catch (error) {
      console.error(`❌ Error in handleCommentAction (${action}):`);
      console.error("  Error type:", error.constructor.name);
      console.error("  Error message:", error.message);
      console.error("  Error stack:", error.stack);
    } finally {
      console.log("=".repeat(60));
    }
  };

  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      
      <Typography color={main} sx={{ mt: "1rem", whiteSpace: "pre-line" }}>
        {description}
      </Typography>
      
      {picturePath !== "Empty Path" && (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={`https://res.cloudinary.com/dsrlvqk3i/${picturePath}`}
        />
      )}
      
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments?.length || 0}</Typography>
          </FlexBetween>
        </FlexBetween>

        <IconButton>
          <ShareOutlined />
        </IconButton>
      </FlexBetween>
      
      {isComments && (
        <Box mt="0.5rem">
          <Divider sx={{ mb: "1rem" }} />
          
          {/* Comment input */}
          <FlexBetween gap="0.5rem" mb="1rem">
            <InputBase
              placeholder="Write a comment..."
              multiline
              maxRows={4}
              value={commentText}
              onChange={(e) => {
                console.log("📝 Comment text changed:", e.target.value);
                setCommentText(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  console.log("⌨️ Enter key pressed (submitting comment)");
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              sx={{
                width: "100%",
                backgroundColor: palette.neutral.light,
                borderRadius: "1.5rem",
                padding: "0.75rem 1rem",
              }}
            />

            <Button
              disabled={!commentText.trim() || isSubmitting}
              onClick={() => {
                console.log("🖱️ Post button clicked");
                handleAddComment();
              }}
              sx={{
                color: palette.background.alt,
                backgroundColor: palette.primary.main,
                borderRadius: "1.5rem",
                padding: "0.5rem 1.5rem",
                "&:hover": {
                  backgroundColor: palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: palette.neutral.light,
                  color: palette.neutral.medium,
                },
              }}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </FlexBetween>

          {/* Comments list */}
          <CommentSection
            comments={comments || []}
            loggedInUserId={loggedInUserId}
            loggedInUser={loggedInUser}
            onCommentAction={handleCommentAction}
          />
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;
