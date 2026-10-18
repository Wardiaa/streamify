import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inviteGroup, getUserFriends } from "../lib/api";
import toast from "react-hot-toast";

const CreateGroupModal = ({ close }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState([]);
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: inviteGroup,
    onSuccess: () => {
      toast.success("Group invites sent!");
      queryClient.invalidateQueries({ queryKey: ["groupRequests"] });
      close();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreate = () => {
    if (!name.trim()) return toast.error("Name required");
    if (selected.length === 0) return toast.error("Select ≥1 friend");
    mutate({ name, description: desc, members: selected });
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Create Group & Invite</h3>
        <input
          type="text"
          placeholder="Group name"
          className="input input-bordered w-full mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          className="textarea textarea-bordered w-full mb-4"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className="max-h-60 overflow-y-auto mb-4">
          {friends.map((fr) => (
            <label
              key={fr._id}
              className="flex items-center gap-3 p-2 hover:bg-base-300 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selected.includes(fr._id)}
                onChange={() => toggle(fr._id)}
              />
              <img
                src={fr.profilePic}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{fr.fullName}</span>
            </label>
          ))}
        </div>
        <div className="modal-action">
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Send Invites"}
          </button>
          <button className="btn" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;