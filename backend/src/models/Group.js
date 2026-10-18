import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, default: "" },
    creator:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // accepted
    channelId:   { type: String, required: true }, // stream channel slug
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);