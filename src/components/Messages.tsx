import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MessagesProps {
  conversationId?: Id<"conversations">;
  onBack?: () => void;
}

export function Messages({ conversationId, onBack }: MessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(
    conversationId || null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery(api.messages.getConversations) || [];
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  ) || [];
  const currentUser = useQuery(api.profiles.getCurrentProfile);

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);

  useEffect(() => {
    if (selectedConversation) {
      markAsRead({ conversationId: selectedConversation });
    }
  }, [selectedConversation, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage({
        conversationId: selectedConversation,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
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

  if (!selectedConversation) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-white mr-3 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  ←
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">Messages 💬</h2>
                <p className="text-sage-100 text-sm">Connect with your community</p>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="p-4">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start a conversation from someone's profile
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation._id)}
                    className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 flex items-center space-x-3 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {conversation.otherUserProfile?.displayName?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.otherUserProfile?.displayName || "Unknown User"}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="bg-sage-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentConversation = conversations.find(c => c._id === selectedConversation);

  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-white mr-3 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              ←
            </button>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">
                {currentConversation?.otherUserProfile?.displayName?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentConversation?.otherUserProfile?.displayName || "Unknown User"}
              </h2>
              {currentConversation?.otherUserProfile?.isSmokingNow && (
                <p className="text-sage-100 text-sm">🌿 Currently smoking</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-gray-500">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUser?.userId;
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? "bg-sage-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-sage-100" : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-sage-600 text-white px-6 py-2 rounded-full hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
