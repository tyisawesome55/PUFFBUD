import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SignOutButton } from "../SignOutButton";
import { Feed } from "./Feed";
import { LogPuff } from "./LogPuff";
import { Stats } from "./Stats";
import { Leaderboard } from "./Leaderboard";
import { Friends } from "./Friends";
import { Messages } from "./Messages";
import { UserProfile } from "./UserProfile";
import { Notifications } from "./Notifications";
import { Strains } from "./Strains";
import { toast } from "sonner";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("feed");
  const [showSmokingModal, setShowSmokingModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [showMore, setShowMore] = useState(false);

  const profile = useQuery(api.profiles.getCurrentProfile);
  const pendingRequests = useQuery(api.friends.getPendingRequests) || [];
  const conversations = useQuery(api.messages.getConversations) || [];
  const unreadNotifications = useQuery(api.notifications.getUnreadCount) || 0;
  const updateSmokingStatus = useMutation(api.profiles.updateSmokingStatus);

  // Calculate unread messages count
  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Show smoking status modal on first load
  useEffect(() => {
    if (profile && !profile.lastSmokingStatusUpdate) {
      const timer = setTimeout(() => {
        setShowSmokingModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleStatusUpdate = async (isSmokingNow: boolean) => {
    try {
      await updateSmokingStatus({ isSmokingNow });
      toast.success(isSmokingNow ? "Enjoy your puff! 🌿" : "Status updated!");
      setShowSmokingModal(false);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleNavigateToMessages = (conversationId?: Id<"conversations">) => {
    setSelectedConversationId(conversationId || null);
    setActiveTab("messages");
  };

  const handleNavigateToProfile = (userId: Id<"users">) => {
    setSelectedUserId(userId);
    setActiveTab("profile");
  };

  const handleBackToFeed = () => {
    setSelectedUserId(null);
    setActiveTab("feed");
  };

  // Main tabs for bottom bar
  const mainTabs = [
    { id: "feed", icon: "🏠", label: "Feed" },
    { id: "friends", icon: "👥", label: "Friends", badge: pendingRequests.length > 0 ? pendingRequests.length : null },
    { id: "messages", icon: "💬", label: "Messages", badge: unreadMessagesCount > 0 ? unreadMessagesCount : null },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  // "More" menu tabs
  const moreTabs = [
    { id: "strains", icon: "🌱", label: "Strains" },
    { id: "log", icon: "🌿", label: "New Puff" },
    { id: "notifications", icon: "🔔", label: "Notifications", badge: unreadNotifications > 0 ? unreadNotifications : null },
    { id: "stats", icon: "📊", label: "Stats" },
    { id: "leaderboard", icon: "🏆", label: "Community" },
    { id: "signout", icon: "🚪", label: "Sign Out" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "feed":
        return <Feed onNavigateToProfile={handleNavigateToProfile} />;
      case "log":
        return <LogPuff />;
      case "friends":
        return <Friends onNavigateToProfile={handleNavigateToProfile} />;
      case "messages":
        return (
          <Messages 
            conversationId={selectedConversationId || undefined}
            onBack={() => {
              setSelectedConversationId(null);
              setActiveTab("messages");
            }}
          />
        );
      case "notifications":
        return <Notifications onNavigateToProfile={handleNavigateToProfile} />;
      case "profile":
        if (selectedUserId && selectedUserId !== profile?.userId) {
          return (
            <UserProfile 
              userId={selectedUserId} 
              isOwnProfile={false}
              onNavigateToMessages={handleNavigateToMessages}
              onBack={handleBackToFeed}
            />
          );
        }
        return profile ? (
          <UserProfile 
            userId={profile.userId} 
            isOwnProfile={true}
            onNavigateToMessages={handleNavigateToMessages}
          />
        ) : null;
      case "stats":
        return <Stats />;
      case "leaderboard":
        return <Leaderboard onNavigateToProfile={handleNavigateToProfile} />;
      case "strains":
        return <Strains />;
      default:
        return <Feed onNavigateToProfile={handleNavigateToProfile} />;
    }
  };

  // Handle "More" menu actions
  const handleMoreTabClick = (tabId: string) => {
    setShowMore(false);
    if (tabId === "signout") {
      window.location.reload();
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-sage-600">🌿 PuffBuddy</h1>
            {profile?.isSmokingNow && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                🌿 Live
              </div>
            )}
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-lg mx-auto px-1">
          <div className="flex justify-around">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "messages") setSelectedConversationId(null);
                  if (tab.id !== "profile") setSelectedUserId(null);
                }}
                className={`flex-1 py-2 flex flex-col items-center space-y-1 transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? "text-sage-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label={tab.label}
              >
                <div className="relative">
                  <span className={`text-2xl transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : ''
                  }`}>
                    {tab.icon}
                  </span>
                  {tab.badge && (
                    <div className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {/* More menu button */}
            <button
              onClick={() => setShowMore((v) => !v)}
              className={`flex-1 py-2 flex flex-col items-center space-y-1 transition-all duration-200 relative ${
                showMore ? "text-sage-600" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="More"
            >
              <span className="text-2xl">⋯</span>
            </button>
          </div>
        </div>
        {/* More menu modal/drawer */}
        {showMore && (
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-black bg-opacity-30" onClick={() => setShowMore(false)}>
            <div
              className="w-full max-w-lg bg-white rounded-t-2xl shadow-lg p-4 pb-8 animate-in slide-in-from-bottom-4 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col space-y-2">
                {moreTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleMoreTabClick(tab.id)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-sage-50 transition-colors text-lg font-medium"
                  >
                    <span className="text-2xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="w-full mt-4 py-2 text-sage-600 font-medium rounded-lg hover:bg-sage-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Smoking Status Modal */}
      {showSmokingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Are you currently smoking?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Let your friends know your current status
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusUpdate(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Not smoking
                </button>
                <button
                  onClick={() => handleStatusUpdate(true)}
                  className="flex-1 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors"
                >
                  Yes, smoking 🌿
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding to account for fixed nav */}
      <div className="h-20"></div>
    </div>
  );
}
