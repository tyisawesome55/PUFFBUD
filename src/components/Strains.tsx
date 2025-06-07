import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const EFFECTS = ["Relaxed", "Focused", "Euphoric", "Creative", "Sleepy", "Energetic", "Happy", "Hungry", "Uplifted"];
const FLAVORS = ["Earthy", "Fruity", "Sweet", "Citrus", "Berry", "Pine", "Spicy", "Herbal", "Woody", "Mint", "Chocolate", "Coffee", "Diesel", "Candy"];
const TYPES = ["Indica", "Sativa", "Hybrid"];
const METHODS = ["Joint", "Pipe", "Bong", "Vape", "Edible", "Dab"];

export function Strains() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [effect, setEffect] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const strains = useQuery(api.strains.listAll) || [];
  const addStrain = useMutation(api.strains.addStrain);

  // Organize strains by type for filter counts
  const strainsByType: Record<string, any[]> = { Indica: [], Sativa: [], Hybrid: [] };
  for (const s of strains) {
    if (TYPES.includes(s.type)) strainsByType[s.type].push(s);
  }

  const filtered = strains.filter((strain: any) => {
    const matchesName = strain.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !type || strain.type === type;
    const matchesEffect = !effect || strain.effects.includes(effect);
    return matchesName && matchesType && matchesEffect;
  });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white text-center">Strains 🌱</h2>
            <p className="text-sage-100 text-center text-sm mt-1">Discover, rate, and review cannabis strains</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="ml-2 px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold hover:bg-sage-200 transition"
            aria-label="Add Strain"
          >
            + Add Strain
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3">
          {/* Strain Types */}
          <div className="flex gap-2 mb-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(type === t ? null : t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  type === t
                    ? "bg-sage-600 text-white"
                    : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                }`}
              >
                {t}
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({strainsByType[t].length})
                </span>
              </button>
            ))}
            <button
              onClick={() => setType(null)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200"
            >
              All
            </button>
          </div>

          {/* Search and Effects */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search strains…"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
            <div className="flex gap-2 flex-wrap">
              {EFFECTS.map(eff => (
                <button
                  key={eff}
                  onClick={() => setEffect(effect === eff ? null : eff)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    effect === eff
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {eff}
                </button>
              ))}
              <button
                onClick={() => setEffect(null)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200"
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strain Posts */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">🌱</div>
          <p className="text-gray-500">No strains found</p>
        </div>
      ) : (
        filtered.map((strain: any) => (
          <StrainPost key={strain._id} strain={strain} />
        ))
      )}

      {showAdd && <AddStrainModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function StrainPost({ strain }: { strain: any }) {
  const [showComments, setShowComments] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [userMethod, setUserMethod] = useState("Joint");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const reviews = useQuery(api.strains.getStrainReviews, { strainId: strain._id }) || [];
  const addReview = useMutation(api.strains.addStrainReview);
  const addToFavorites = useMutation(api.strains.addToFavorites);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating) return;
    
    setIsSubmittingReview(true);
    try {
      await addReview({
        strainId: strain._id,
        rating: userRating,
        review: userReview.trim() || undefined,
        method: userMethod,
      });
      setUserRating(0);
      setUserReview("");
      setUserMethod("Joint");
      toast.success("Review added! 🌿");
    } catch (error: any) {
      toast.error(error.message || "Failed to add review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommenting(true);
    try {
      // For now, we'll just show a success message
      // In a real app, you'd have a comments system for strains
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleLike = async () => {
    try {
      await addToFavorites({ strainId: strain._id });
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      toast.success(isLiked ? "Removed from favorites" : "Added to favorites! ❤️");
    } catch (error) {
      toast.error("Failed to update favorites");
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

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
      {/* Strain Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-sage-700">{strain.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                strain.type === "Indica"
                  ? "bg-purple-100 text-purple-700"
                  : strain.type === "Sativa"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {strain.type}
              </span>
            </div>
            
            {/* THC/CBD Info */}
            <div className="flex items-center gap-4 mb-3">
              {strain.thc && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  THC: {strain.thc}%
                </span>
              )}
              {strain.cbd && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  CBD: {strain.cbd}%
                </span>
              )}
              {strain.avgRating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="font-semibold text-gray-700">{strain.avgRating}</span>
                  <span className="text-gray-500 text-sm">({strain.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>

            {/* Description */}
            {strain.description && (
              <p className="text-gray-600 mb-4 leading-relaxed">{strain.description}</p>
            )}

            {/* Effects and Flavors */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Effects:</span>
                {strain.effects.map((effect: string) => (
                  <span key={effect} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {effect}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Flavors:</span>
                {strain.flavors.map((flavor: string) => (
                  <span key={flavor} className="bg-sage-100 text-sage-700 px-2 py-1 rounded-full text-xs font-medium">
                    {flavor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Rating */}
        <div className="bg-sage-50 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-sage-700 text-sm mb-3">Rate this strain</h4>
          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rating:</span>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className={`text-2xl transition-all duration-200 hover:scale-110 ${
                    star <= userRating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                  }`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={userReview}
                onChange={e => setUserReview(e.target.value)}
                placeholder="Share your experience..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
                maxLength={200}
              />
              <select
                value={userMethod}
                onChange={e => setUserMethod(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                {METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={!userRating || isSubmittingReview}
              className="w-full bg-sage-600 text-white py-2 rounded-lg font-semibold hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-sage-600 transition-colors duration-200 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
              <span className="text-sm font-medium">{reviews.length}</span>
            </button>
            
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 group ${
                isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
              }`}
            >
              <div className={`text-xl transition-transform duration-200 ${isLiked ? 'scale-110' : 'group-hover:scale-110'}`}>
                {isLiked ? "❤️" : "🤍"}
              </div>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-sage-600 transition-colors duration-200 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📤</span>
            </button>
          </div>
          
          <span className="text-xs text-gray-500">{formatTime(strain.createdAt)}</span>
        </div>
      </div>

      {/* Reviews/Comments */}
      {showComments && (
        <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {reviews.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-2xl mb-2">🌱</div>
              <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {reviews.map((review: any) => (
                <div key={review._id} className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-25 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {review.user?.displayName?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-gray-900">
                              {review.user?.displayName || "Anonymous"}
                            </span>
                            <div className="flex items-center">
                              <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}</span>
                              <span className="text-gray-300 text-sm">{'☆'.repeat(5 - review.rating)}</span>
                            </div>
                          </div>
                          {review.method && (
                            <span className="bg-sage-200 text-sage-700 px-2 py-1 rounded-full text-xs font-medium">
                              {review.method}
                            </span>
                          )}
                        </div>
                        {review.review && (
                          <p className="text-gray-800 text-sm mb-2">{review.review}</p>
                        )}
                        <p className="text-xs text-gray-500">{formatTime(review.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Comment */}
          <div className="p-4 bg-gray-50">
            <form onSubmit={handleAddComment} className="flex space-x-3">
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

function AddStrainModal({ onClose }: { onClose: () => void }) {
  const addStrain = useMutation(api.strains.addStrain);
  const [name, setName] = useState("");
  const [type, setType] = useState("Hybrid");
  const [description, setDescription] = useState("");
  const [thc, setThc] = useState<number | "">("");
  const [cbd, setCbd] = useState<number | "">("");
  const [effects, setEffects] = useState<string[]>([]);
  const [flavors, setFlavors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (arr: string[], value: string, setArr: (a: string[]) => void) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await addStrain({
        name: name.trim(),
        type,
        description: description.trim(),
        thc: thc === "" ? undefined : Number(thc),
        cbd: cbd === "" ? undefined : Number(cbd),
        effects,
        flavors,
      });
      onClose();
      setName("");
      setDescription("");
      setThc("");
      setCbd("");
      setEffects([]);
      setFlavors([]);
      toast.success("Strain added! 🌱");
    } catch (error: any) {
      toast.error(error.message || "Failed to add strain");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-sage-600 text-xl"
          aria-label="Close"
        >✕</button>
        <h3 className="text-lg font-bold text-sage-700 mb-4">Add a New Strain</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Strain Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              required
              maxLength={40}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    type === t
                      ? "bg-sage-600 text-white"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              rows={2}
              maxLength={200}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">THC %</label>
              <input
                type="number"
                min={0}
                max={40}
                value={thc}
                onChange={e => setThc(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="e.g. 18"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">CBD %</label>
              <input
                type="number"
                min={0}
                max={40}
                value={cbd}
                onChange={e => setCbd(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="e.g. 1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Effects</label>
            <div className="flex flex-wrap gap-2">
              {EFFECTS.map(eff => (
                <button
                  key={eff}
                  type="button"
                  onClick={() => handleToggle(effects, eff, setEffects)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    effects.includes(eff)
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Flavors</label>
            <div className="flex flex-wrap gap-2">
              {FLAVORS.map(flav => (
                <button
                  key={flav}
                  type="button"
                  onClick={() => handleToggle(flavors, flav, setFlavors)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    flavors.includes(flav)
                      ? "bg-sage-600 text-white"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {flav}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="w-full bg-sage-600 text-white py-2 rounded-lg font-semibold hover:bg-sage-700 transition"
          >
            {isSaving ? "Saving..." : "Add Strain"}
          </button>
        </form>
      </div>
    </div>
  );
}
