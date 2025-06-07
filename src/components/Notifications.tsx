import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface NotificationsProps {
  onNavigateToProfile?: (userId: Id<"users">) => void;
}

export function Notifications({ onNavigateToProfile }: NotificationsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "likes">("all");
  
  const notifications = useQuery(api.notifications.getNotifications) || [];
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleNotificationClick = async (notificationId: Id<"notifications">, fromUserId: Id<"users">) => {
    try {
      await markAsRead({ notificationId });
      if (onNavigateToProfile) {
        onNavigateToProfile(fromUserId);
      }
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read");
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like": return "❤️";
      case "comment": return "💬";
      case "follow": return "👥";
      case "retweet": return "🔄";
      case "mention": return "📢";
      default: return "🔔";
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "mentions") return notification.type === "mention";
    if (activeTab === "likes") return notification.type === "like";
    return true;
  });

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "mentions" as const, label: "Mentions" },
    { id: "likes" as const, label: "Likes" },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Notifications 🔔</h2>
              <p className="text-sage-100 text-sm mt-1">Stay updated with your community</p>
            </div>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-sage-100 hover:text-white text-sm font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                When people interact with your posts, you'll see it here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification._id, notification.fromUserId)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-sage-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {notification.fromUserProfile?.displayName?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">
                            {notification.fromUserProfile?.displayName || "Someone"}
                          </span>{" "}
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-sage-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
