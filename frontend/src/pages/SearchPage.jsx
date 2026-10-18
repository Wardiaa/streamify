import { useState } from "react";
import { searchUsers } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import FriendCard from "../components/FriendCard";

const SearchPage = () => {
  const [query, setQuery] = useState("");

  const { data: users = [], refetch } = useQuery({
    queryKey: ["searchUsers", query],
    queryFn: () => searchUsers(query),
    enabled: false,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Users</h1>
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email"
          className="input input-bordered w-full max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary ml-2">Search</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <FriendCard key={user._id} friend={user} />
        ))}
      </div>
    </div>
  );
};

export default SearchPage;