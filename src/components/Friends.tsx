import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface FriendsProps {
  onNavigateToProfile?: (userId: Id<"users">) => void;
}

export function Friends({ onNavigateToProfile }: FriendsProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchTerm, setSearchTerm] = useState("");

  const friends = useQuery(api.friends.getFriends) || [];
  const pendingRequests = useQuery(api.friends.getPendingRequests) || [];
  const searchResults = useQuery(api.friends.searchUsers, { searchTerm }) || [];

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const declineFriendRequest = useMutation(api.friends.declineFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const getOrCreateConversation = useMutation(api.profiles.getOrCreateConversation);

  const handleSendRequest = async (userId: any) => {
    try {
      await sendFriendRequest({ receiverId: userId });
      toast.success("Friend request sent! 🌿");
    } catch (error) {
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (friendshipId: any) => {
    try {
      await acceptFriendRequest({ friendshipId });
      toast.success("Friend request accepted! 🎉");
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (friendshipId: any) => {
    try {
      await declineFriendRequest({ friendshipId });
      toast.success("Friend request declined");
    } catch (error) {
      toast.error("Failed to decline request");
    }
  };

  const handleRemoveFriend = async (friendshipId: any) => {
    try {
      await removeFriend({ friendshipId });
      toast.success("Friend removed");
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  const handleSendMessage = async (userId: any) => {
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: userId });
      toast.success("Opening conversation...");
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  const handleProfileClick = (userId: Id<"users"> | undefined) => {
    if (userId && onNavigateToProfile) {
      onNavigateToProfile(userId);
    }
  };

  const tabs = [
    { id: "friends" as const, label: "Friends", count: friends.length },
    { id: "requests" as const, label: "Requests", count: pendingRequests.length },
    { id: "search" as const, label: "Find Friends", count: null },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">Friends 👥</h2>
          <p className="text-sage-100 text-center text-sm mt-1">Connect with your cannabis community</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-sage-600 border-b-2 border-sage-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-sage-100 text-sage-800 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === "search" && (
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for friends..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {activeTab === "friends" && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-500">No friends yet. Start by searching for people!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend._id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleProfileClick(friend.friendProfile?.userId)}
                        className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <span className="text-white font-bold">
                          {friend.friendProfile?.displayName?.[0]?.toUpperCase() || "?"}
                        </span>
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProfileClick(friend.friendProfile?.userId)}
                            className="font-semibold text-gray-900 hover:text-sage-600 transition-colors"
                          >
                            {friend.friendProfile?.displayName || "Unknown User"}
                          </button>
                          {friend.friendProfile?.isSmokingNow && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              🌿 Smoking
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {friend.friendProfile?.bio || "Cannabis enthusiast"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📬</div>
                  <p className="text-gray-500">No pending friend requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <button
                        onClick={() => handleProfileClick(request.requesterProfile?.userId)}
                        className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <span className="text-white font-bold">
                          {request.requesterProfile?.displayName?.[0]?.toUpperCase() || "?"}
                        </span>
                      </button>
                      <div>
                        <button
                          onClick={() => handleProfileClick(request.requesterProfile?.userId)}
                          className="font-semibold text-gray-900 hover:text-sage-600 transition-colors"
                        >
                          {request.requesterProfile?.displayName || "Unknown User"}
                        </button>
                        <p className="text-sm text-gray-500">
                          {request.requesterProfile?.bio || "Cannabis enthusiast"}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex-1 bg-sage-600 text-white py-2 px-4 rounded-lg hover:bg-sage-700 transition-colors font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request._id)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "search" && (
            <div className="space-y-3">
              {!searchTerm.trim() ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500">Start typing to search for friends</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">😔</div>
                  <p className="text-gray-500">No users found matching "{searchTerm}"</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div key={user._id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleProfileClick(user.userId)}
                        className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <span className="text-white font-bold">
                          {user.displayName?.[0]?.toUpperCase() || "?"}
                        </span>
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProfileClick(user.userId)}
                            className="font-semibold text-gray-900 hover:text-sage-600 transition-colors"
                          >
                            {user.displayName}
                          </button>
                          {user.isSmokingNow && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              🌿 Smoking
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.bio || "Cannabis enthusiast"}</p>
                      </div>
                    </div>
                    <div>
                      {user.friendshipStatus === "none" && (
                        <button
                          onClick={() => handleSendRequest(user.userId)}
                          className="bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors font-medium text-sm"
                        >
                          Add Friend
                        </button>
                      )}
                      {user.friendshipStatus === "sent" && (
                        <span className="text-gray-500 text-sm font-medium">Request Sent</span>
                      )}
                      {user.friendshipStatus === "received" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(user.friendshipId)}
                            className="bg-sage-600 text-white px-3 py-1 rounded text-sm hover:bg-sage-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(user.friendshipId)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {user.friendshipStatus === "friends" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSendMessage(user.userId)}
                            className="bg-sage-600 text-white px-3 py-1 rounded text-sm hover:bg-sage-700 transition-colors"
                          >
                            Message
                          </button>
                          <span className="text-sage-600 text-sm font-medium self-center">✓ Friends</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
