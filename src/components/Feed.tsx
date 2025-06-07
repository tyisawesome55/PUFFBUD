import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface FeedProps {
  onNavigateToProfile?: (userId: Id<"users">) => void;
}

export function Feed({ onNavigateToProfile }: FeedProps) {
  const posts = useQuery(api.posts.getFeed) || [];
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [faded, setFaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const likePost = useMutation(api.posts.likePost);
  const retweetPost = useMutation(api.posts.retweetPost);
  const addComment = useMutation(api.posts.addComment);
  const likeComment = useMutation(api.posts.likeComment);
  const deletePost = useMutation(api.posts.deletePost);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedImage) return;
    setIsPosting(true);
    try {
      let imageId = undefined;
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const json = await result.json();
        if (!result.ok) throw new Error("Upload failed");
        imageId = json.storageId;
      }

      await createPost({
        content: newPost.trim() || "",
        type: selectedImage ? "photo" : "text",
        imageId,
        faded: faded ? true : undefined,
      });

      setNewPost("");
      setFaded(false);
      removeImage();
      toast.success("Posted! 🌿");
    } catch (error) {
      toast.error("Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: any) => {
    try {
      await likePost({ postId });
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleRetweet = async (postId: any) => {
    try {
      await retweetPost({ postId });
    } catch (error) {
      toast.error("Failed to retweet");
    }
  };

  const handleDelete = async (postId: Id<"posts">) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost({ postId });
      toast.success("Post deleted.");
    } catch (error) {
      toast.error("Failed to delete post");
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

  // Get current userId for delete button
  const currentUser = useQuery(api.profiles.getCurrentProfile);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Create Post */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4">
          <form onSubmit={handleCreatePost}>
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🌿</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's happening in your cannabis journey?"
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                />

                {imagePreview && (
                  <div className="mt-3 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* FADED Tag Selector */}
                <div className="flex items-center mt-3 space-x-2">
                  <button
                    type="button"
                    onClick={() => setFaded((v) => !v)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      faded
                        ? "bg-red-100 text-red-600 border border-red-200 animate-faded-flash"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {faded ? "FADED" : "Add FADED Tag"}
                  </button>
                  <style>
                    {`
                    @keyframes faded-flash {
                      0%, 100% { background-color: #fee2e2; }
                      50% { background-color: #fecaca; }
                    }
                    .animate-faded-flash {
                      animation: faded-flash 1.5s infinite;
                    }
                    `}
                  </style>
                  <span className="text-xs text-gray-400">(optional)</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-sage-600 hover:bg-sage-100 rounded-full transition-colors"
                    >
                      📷
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={(!newPost.trim() && !selectedImage) || isPosting}
                    className="bg-gradient-to-r from-sage-600 to-sage-700 text-white px-6 py-2 rounded-full hover:from-sage-700 hover:to-sage-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-md active:scale-95"
                  >
                    {isPosting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-gray-500">No posts yet. Start by sharing your first session!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={() => handleLike(post._id)}
            onRetweet={() => handleRetweet(post._id)}
            onLikeComment={likeComment}
            onNavigateToProfile={onNavigateToProfile}
            onDelete={() => handleDelete(post._id)}
            canDelete={currentUser?.userId === post.userId}
            formatTime={formatTime}
          />
        ))
      )}
    </div>
  );
}

function PostCard({ post, onLike, onRetweet, onLikeComment, onNavigateToProfile, onDelete, canDelete, formatTime }: any) {
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

  const handleCommentLike = async (commentId: any) => {
    try {
      await onLikeComment({ commentId });
    } catch (error) {
      toast.error("Failed to like comment");
    }
  };

  const handleProfileClick = () => {
    if (onNavigateToProfile && post.profile?.userId) {
      onNavigateToProfile(post.profile.userId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleProfileClick}
            className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200"
          >
            <span className="text-white font-bold text-sm">
              {post.profile?.displayName?.[0]?.toUpperCase() || "?"}
            </span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleProfileClick}
                className="font-semibold text-gray-900 text-sm hover:text-sage-600 transition-colors"
              >
                {post.profile?.displayName || "Unknown User"}
              </button>
              {post.profile?.verified && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
              {post.profile?.isSmokingNow && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  🌿 Live
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="ml-2 text-xs text-red-500 font-bold px-2 py-1 rounded hover:bg-red-50 transition"
            title="Delete post"
          >
            Delete
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className="w-full rounded-xl object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
          />
        </div>
      )}

      {/* FADED Tag */}
      {post.faded && (
        <div className="px-4 pb-2">
          <span className="inline-block bg-red-100 text-red-600 font-bold px-4 py-1 rounded-full text-xs animate-faded-flash border border-red-200 shadow-sm select-none">
            FADED
            <style>
              {`
              @keyframes faded-flash {
                0%, 100% { background-color: #fee2e2; color: #dc2626; }
                50% { background-color: #fecaca; color: #b91c1c; }
              }
              .animate-faded-flash {
                animation: faded-flash 1.5s infinite;
              }
              `}
            </style>
          </span>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-sage-600 transition-colors duration-200 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
            </button>
            
            <button
              onClick={onRetweet}
              className={`flex items-center space-x-2 transition-colors duration-200 group ${
                post.isRetweeted
                  ? "text-green-600"
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🔄</span>
              <span className="text-sm font-medium">{post.retweets || 0}</span>
            </button>
            
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 transition-all duration-200 group ${
                post.isLiked
                  ? "text-red-500"
                  : "text-gray-600 hover:text-red-500"
              }`}
            >
              <div className={`text-xl transition-transform duration-200 ${post.isLiked ? 'scale-110' : 'group-hover:scale-110'}`}>
                {post.isLiked ? "❤️" : "🤍"}
              </div>
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-sage-600 transition-colors duration-200 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📤</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {post.comments?.map((comment: any) => (
            <div key={comment._id} className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-25 transition-colors">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => onNavigateToProfile && onNavigateToProfile(comment.profile?.userId)}
                  className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
                >
                  <span className="text-white text-xs font-bold">
                    {comment.profile?.displayName?.[0]?.toUpperCase() || "?"}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2 mb-1">
                      <button
                        onClick={() => onNavigateToProfile && onNavigateToProfile(comment.profile?.userId)}
                        className="font-semibold text-sm text-gray-900 hover:text-sage-600 transition-colors"
                      >
                        {comment.profile?.displayName || "Unknown User"}
                      </button>
                      {comment.profile?.verified && (
                        <span className="text-blue-500 text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-gray-800 text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 ml-1">{formatTime(comment.createdAt)}</p>
                    <button
                      onClick={() => handleCommentLike(comment._id)}
                      className={`flex items-center space-x-1 transition-colors hover:scale-105 ${
                        comment.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <span className="text-sm">{comment.isLiked ? "❤️" : "🤍"}</span>
                      {comment.likes > 0 && (
                        <span className="text-xs">{comment.likes}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Comment */}
          <div className="p-4 bg-gray-50">
            <form onSubmit={handleComment} className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">🌿</span>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isCommenting}
                  className="bg-sage-600 text-white px-4 py-2 rounded-full hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95"
                >
                  {isCommenting ? "..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
