import { generateStreamToken } from "../lib/stream.js";
import { streamClient } from "../lib/stream.js";
import crypto from "crypto";
import User from "../models/User.js";
import Group from "../models/Group.js";
import GroupRequest from "../models/GroupRequest.js";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createGroupChannel(req, res) {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length < 1)
      return res.status(400).json({ message: "Name + ≥1 member required" });

    const slug = crypto.randomBytes(4).toString("hex"); // 8-char id
    const allMembers = [req.user.id, ...members].map(id =>
      id.toString().toLowerCase()
    );

    const channel = streamClient.channel("messaging", slug, {
      name,
      members: allMembers,
      created_by_id: req.user.id,
    });

    await channel.create();

    return res.status(200).json({
      id: slug,
      name,
      members: allMembers,
    });
  } catch (err) {
    console.error("Group creation error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


// helpers: upsert one user to Stream
const upsertUserToStream = async (userDoc) => {
  await streamClient.upsertUser({
    id: userDoc._id.toString().toLowerCase(),
    name: userDoc.fullName,
    image: userDoc.profilePic || "",
  });
};

const ensureStreamUsers = async (userIds) => {
  for (const id of userIds) {
    const u = await User.findById(id).lean();
    if (u) await upsertUserToStream(u);
  }
};

const openGroupChannelSafe = async (channelId, memberIds) => {
  // upsert every member first
  for (const id of memberIds) {
    const u = await User.findById(id).lean();
    if (u) await upsertUserToStream(u);
  }
  // now open the channel
  const channel = streamClient.channel("messaging", channelId);
  await channel.watch(); // or .create() if first time
  return channel;
};

export async function inviteGroup(req, res) {
  try {
    const { name, description, members } = req.body; // members = [friendIds]
    if (!name || !Array.isArray(members) || members.length < 1)
      return res.status(400).json({ message: "Name + ≥1 friend required" });

    const slug = crypto.randomBytes(4).toString("hex");
    const allMembers = [req.user.id, ...members].map(id => id.toString().toLowerCase());

    // upsert users to Stream
    await upsertUserToStream(req.user);
    for (const fid of members) {
      const f = await User.findById(fid).lean();
      if (f) await upsertUserToStream(f);
    }
    // upsert every member to Stream
    await ensureStreamUsers(allMembers);

    // create Stream channel
    const channel = streamClient.channel("messaging", slug, {
      name,
      members: allMembers,
      created_by_id: req.user.id,
    });
    await channel.create();

    // save group
    const group = await Group.create({
      name,
      description,
      creator: req.user.id,
      members: [req.user.id], // creator auto-accepted
      channelId: slug,
    });

    // send request to each friend
    await GroupRequest.insertMany(
      members.map(id => ({ group: group._id, recipient: id }))
    );

    res.status(201).json({ group });
  } catch (err) {
    console.error("Invite group error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptGroupRequest(req, res) {
  try {
    const request = await GroupRequest.findById(req.params.id)
      .populate("group")
      .populate("recipient");

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.recipient._id.toString() !== req.user.id)
      return res.status(403).json({ message: "Not your request" });

    request.status = "accepted";
    await request.save();

    // add yourself to group
    await Group.findByIdAndUpdate(request.group._id, {
      $addToSet: { members: req.user.id },
    });

    // ⬇️ upsert yourself to Stream
    const me = await User.findById(req.user.id).lean();
    await upsertUserToStream(me);

    res.json({ message: "Group invite accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyGroups(req, res) {
  try {
    const groups = await Group.find({ members: req.user.id })
      .select("name description channelId")
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
} 

export async function getGroupRequests(req, res) {
  try {
    const requests = await GroupRequest.find({ recipient: req.user.id, status: "pending" })
      .populate("group", "name description");
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function enterGroup(req, res) {
  try {
    const group = await Group.findOne({ channelId: req.params.channelId });
    if (!group) return res.status(404).json({ message: "Group not found" });

    // must be a member
    if (!group.members.includes(req.user.id))
      return res.status(403).json({ message: "Not a member" });

    // upsert all members before opening
    await openGroupChannelSafe(group.channelId, group.members);

    res.json({ ok: true });
  } catch (err) {
    console.error("Enter group error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}