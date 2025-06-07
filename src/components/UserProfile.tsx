import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { BackgroundPhotoUpload } from "./BackgroundPhotoUpload";
import { UserPosts } from "./UserPosts";
import { toast } from "sonner";

// Fun tag suggestions (should match backend)
const SUGGESTED_TAGS = [
  "420 Friendly",
  "Wake & Bake",
  "Couch Philosopher",
  "Snack Master",
  "Rolling Pro",
  "Cloud Chaser",
  "Bong Appétit",
  "Joint Venture",
  "Chill Chief",
  "Munchies Expert",
  "Sativa Socialite",
  "Indica Enthusiast",
  "Dab Wizard",
  "Edible Explorer",
  "Highspirational",
  "Giggle Factory",
  "Zen Stoner",
  "Herb Nerd",
  "Puff Puff Pal",
  "Green Thumb",
  "Chronic Comedian",
  "Blunt Force",
  "Weed Connoisseur",
  "Grass Guru",
  "Vape Lord",
  "Rolling Stone",
  "Baked & Blessed",
  "Stash Captain",
  "Doobie Newbie",
  "Potent Pal",
  "Chilluminati",
];

function getRandomTags(n: number) {
  const shuffled = SUGGESTED_TAGS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

interface UserProfileProps {
  userId: Id<"users">;
  isOwnProfile?: boolean;
  onNavigateToMessages?: (conversationId: Id<"conversations">) => void;
  onBack?: () => void;
}

export function UserProfile({ userId, isOwnProfile = false, onNavigateToMessages, onBack }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "followers" | "following">("posts");
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    smokingGoal: "",
    location: "",
    website: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const profile = useQuery(api.profiles.getProfile, { userId });
  const followStatus = useQuery(api.follows.getFollowStatus, { userId });
  const followCounts = useQuery(api.follows.getFollowCounts, { userId });
  const userPosts = useQuery(api.posts.getUserPosts, { userId }) || [];
  const photoUrl = useQuery(api.profiles.getProfilePhotoUrl, 
    profile?.photoId ? { photoId: profile.photoId } : "skip"
  );
  const backgroundUrl = useQuery(api.profiles.getBackgroundPhotoUrl,
    profile?.backgroundId ? { backgroundId: profile.backgroundId } : "skip"
  );

  const updateProfile = useMutation(api.profiles.updateProfile);
  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);
  const getOrCreateConversation = useMutation(api.profiles.getOrCreateConversation);

  // Tag input helpers
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.length > 0) {
      setTagSuggestions(
        SUGGESTED_TAGS.filter(
          (tag) =>
            tag.toLowerCase().includes(value.toLowerCase()) &&
            !editForm.tags.includes(tag)
        ).slice(0, 5)
      );
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!editForm.tags.includes(tag) && editForm.tags.length < 5) {
      setEditForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput("");
      setTagSuggestions([]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditForm((f) => ({
      ...f,
      tags: f.tags.filter((t) => t !== tag),
    }));
  };

  const handleEditStart = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio || "",
        smokingGoal: profile.smokingGoal || "",
        location: profile.location || "",
        website: profile.website || "",
        tags: profile.tags || getRandomTags(3),
      });
      setIsEditing(true);
    }
  };

  const handleEditSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      toast.success("Profile updated! ✨");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleFollow = async () => {
    try {
      if (followStatus === "following") {
        await unfollowUser({ userId });
        toast.success("Unfollowed user");
      } else {
        await followUser({ userId });
        toast.success("Following user! 🌿");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const handleMessage = async () => {
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: userId });
      if (onNavigateToMessages) {
        onNavigateToMessages(conversationId);
      } else {
        toast.success("Conversation created! Check your messages.");
      }
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "posts" as const, label: "Posts", count: userPosts.length },
    { id: "likes" as const, label: "Likes", count: null },
    { id: "followers" as const, label: "Followers", count: followCounts?.followers || 0 },
    { id: "following" as const, label: "Following", count: followCounts?.following || 0 },
  ];

  return (
    <div className="max-w-lg mx-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header with Back Button */}
        {!isOwnProfile && onBack && (
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
            <button
              onClick={onBack}
              className="text-sage-600 hover:text-sage-700 transition-colors mr-3 p-1 rounded-full hover:bg-sage-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{profile.displayName}</h2>
          </div>
        )}

        {/* Background Photo */}
        <div className="relative h-48 bg-gradient-to-r from-sage-500 to-sage-600">
          {backgroundUrl ? (
            <img 
              src={backgroundUrl} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-sage-500 to-sage-600"></div>
          )}
          
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <BackgroundPhotoUpload onPhotoUpdated={() => {}} />
            </div>
          )}

          {/* Profile Photo */}
          <div className="absolute -bottom-16 left-6">
            {isOwnProfile ? (
              <div className="relative">
                <ProfilePhotoUpload 
                  currentPhotoUrl={photoUrl}
                  onPhotoUpdated={() => {}}
                  size="large"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg hover:scale-105 transition-transform duration-200">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {profile.displayName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-6 pb-6">
          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex justify-end space-x-3 mb-4">
              <button
                onClick={handleMessage}
                className="border border-sage-600 text-sage-600 px-4 py-2 rounded-full hover:bg-sage-50 transition-all font-medium hover:scale-105 active:scale-95"
              >
                Message
              </button>
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95 ${
                  followStatus === "following"
                    ? "bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600"
                    : "bg-sage-600 text-white hover:bg-sage-700"
                }`}
              >
                {followStatus === "following" ? "Following" : "Follow"}
              </button>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4 animate-in slide-in-from-top duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none transition-all"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 transition-all"
                  placeholder="Where are you based?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cannabis Goal
                </label>
                <select
                  value={editForm.smokingGoal}
                  onChange={(e) => setEditForm({ ...editForm, smokingGoal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 transition-all"
                >
                  <option value="">Select a goal</option>
                  <option value="medical">Medical</option>
                  <option value="recreational">Recreational</option>
                  <option value="social">Social</option>
                  <option value="wellness">Wellness</option>
                  <option value="track">Track Usage</option>
                </select>
              </div>

              {/* Tag Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fun Tags <span className="text-xs text-gray-400">(max 5)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-sage-500 hover:text-red-500"
                        aria-label="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {editForm.tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      placeholder="Add tag…"
                      className="px-2 py-1 border border-gray-300 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-sage-500"
                      maxLength={20}
                    />
                  )}
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="bg-sage-50 text-sage-700 px-2 py-1 rounded-full text-xs hover:bg-sage-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                {editForm.tags.length < 5 && tagInput.length > 0 && tagSuggestions.length === 0 && (
                  <div className="text-xs text-gray-400 mt-1">No matching tags found</div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-all hover:scale-105 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.displayName}
                  </h1>
                  {profile.verified && (
                    <span className="text-blue-500 text-xl">✓</span>
                  )}
                  {profile.isSmokingNow && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                      🌿 Smoking
                    </span>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700 mt-2 leading-relaxed">{profile.bio}</p>
                )}

                {/* Fun Tags */}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-block bg-sage-50 text-sage-700 px-3 py-1 rounded-full text-xs font-medium border border-sage-100"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <span>📍</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center space-x-1">
                      <span>🔗</span>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sage-600 hover:underline transition-colors"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {profile.smokingGoal && (
                  <div className="mt-3">
                    <span className="inline-block bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                      {profile.smokingGoal} user
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{followCounts?.followers || 0}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{followCounts?.following || 0}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={handleEditStart}
                  className="w-full border border-sage-600 text-sage-600 px-4 py-2 rounded-full hover:bg-sage-50 transition-all font-medium hover:scale-105 active:scale-95"
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-sage-600 border-b-2 border-sage-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === "posts" && <UserPosts userId={userId} />}
          {activeTab === "likes" && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">❤️</div>
              <p>Liked posts will appear here</p>
            </div>
          )}
          {activeTab === "followers" && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">👥</div>
              <p>Followers will appear here</p>
            </div>
          )}
          {activeTab === "following" && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">👥</div>
              <p>Following will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
