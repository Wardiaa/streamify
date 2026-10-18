import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, createGroupChannel, getMyGroups, inviteGroup, acceptGroupRequest, getGroupRequests, enterGroup  } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);

router.post("/create-group", protectRoute, createGroupChannel);

router.get("/my-groups", protectRoute, getMyGroups);

router.post("/invite-group", protectRoute, inviteGroup);

router.put("/group-request/:id/accept", protectRoute, acceptGroupRequest);

router.get("/group-requests", protectRoute, getGroupRequests);

router.post("/group/:channelId/enter", protectRoute, enterGroup);

export default router;
