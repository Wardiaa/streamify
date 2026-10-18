import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyGroups, enterGroup } from "../lib/api";
import { useNavigate } from "react-router";
import { UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";


const GroupsPage = () => {
  const navigate = useNavigate();

  // list my accepted groups
  const { data, isLoading } = useQuery({
    queryKey: ["myGroups"],
    queryFn: getMyGroups,
  });
  const groups = Array.isArray(data) ? data : [];

  // enter group (upsert all members then open chat)
  const { mutate: enterMutation } = useMutation({
    mutationFn: enterGroup,
    onSuccess: () => {
      toast.success("Entering group…");
      // navigate after success so ChatPage can open the channel
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to enter group"),
  });

const handleEnter = async (channelId) => {
  console.log("Enter clicked – calling /enter for", channelId);
  try {
    await axiosInstance.post(`/chat/group/${channelId}/enter`);
    console.log("/enter success – now navigating");
    navigate(`/group/${channelId}`);
  } catch (err) {
    console.error("/enter failed", err);
    toast.error("Could not enter group");
  }
};

  if (isLoading)        
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
    

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Groups</h2>
      {groups.length === 0 ? (
        <p className="opacity-70">You haven't joined any groups yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className="card bg-base-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="size-6 text-primary" />
                <div>
                  <h3 className="font-semibold">{g.name}</h3>
                  <p className="text-xs opacity-70">{g.description}</p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleEnter(g.channelId)}
              >
                Enter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsPage;