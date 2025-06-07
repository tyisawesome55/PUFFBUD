import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

interface UserPostsProps {
  userId: Id<"users">;
}

export function UserPosts({ userId }: UserPostsProps) {
  const posts = useQuery(api.posts.getUserPosts, { userId }) || [];
  const likePost = useMutation(api.posts.likePost);
  const retweetPost = useMutation(api.posts.retweetPost);
  const addComment = useMutation(api.posts.addComment);

  const handleLike = async (postId: Id<"posts">) => {
    try {
      await likePost({ postId });
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleRetweet = async (postId: Id<"posts">) => {
    try {
      await retweetPost({ postId });
    } catch (error) {
      toast.error("Failed to retweet");
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

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">🌿</div>
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLike={() => handleLike(post._id)}
          onRetweet={() => handleRetweet(post._id)}
          formatTime={formatTime}
        />
      ))}
    </div>
  );
}

function PostCard({ post, onLike, onRetweet, formatTime }: any) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const addComment = useMutation(api.posts.addComment);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommenting(true);
    try {
      await addComment({
        postId: post._id,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {post.profile?.displayName?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{post.profile?.displayName || "Unknown User"}</h3>
            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>
        {post.type === "session" && (
          <div className="bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-xs font-medium">
            🌿 Session
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mb-3">
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className="w-full rounded-xl object-cover max-h-96"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between text-gray-500">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:text-sage-600 transition-colors"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm">{post.comments || 0}</span>
        </button>

        <button
          onClick={onRetweet}
          className={`flex items-center space-x-2 transition-colors ${
            post.isRetweeted ? "text-green-600" : "hover:text-green-600"
          }`}
        >
          <span className="text-lg">🔄</span>
          <span className="text-sm">{post.retweets || 0}</span>
        </button>

        <button
          onClick={onLike}
          className={`flex items-center space-x-2 transition-colors ${
            post.isLiked ? "text-red-500" : "hover:text-red-500"
          }`}
        >
          <span className="text-lg">{post.isLiked ? "❤️" : "🤍"}</span>
          <span className="text-sm">{post.likes}</span>
        </button>

        <button className="flex items-center space-x-2 hover:text-sage-600 transition-colors">
          <span className="text-lg">📤</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <form onSubmit={handleComment} className="flex space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">🌿</span>
            </div>
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                className="bg-sage-600 text-white px-4 py-2 rounded-full hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isCommenting ? "..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
