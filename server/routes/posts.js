import express from "express";
import { getFeedPosts, getUserPosts, likePost } from "../controllers/posts.js";
import { verifytoken } from "../middleware/auth.js";

const router = express.Router();
//Read
router.get("/", verifytoken, getFeedPosts);
router.get("/:userId/posts", verifytoken, getUserPosts);
//Update
router.patch("/:id/like", verifytoken, likePost);
export default router;
