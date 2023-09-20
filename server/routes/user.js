import express from "express";
import {
    getUser,
    getUserFriends,
    addRemoveFriend,
} from "../controllers/user.js";
import { verifytoken } from "../middleware/auth.js";

const router = express.Router();
//Read
router.get("/:id", verifytoken, getUser);
router.get("/:id/friends", verifytoken, getUserFriends);
//Update
router.patch("/:id/:friendId", verifytoken, addRemoveFriend);
export default router;