import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [smokingGoal, setSmokingGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createProfile = useMutation(api.profiles.createProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsLoading(true);
    try {
      await createProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        smokingGoal: smokingGoal || undefined,
      });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PuffBuddy! 🌿</h1>
          <p className="text-gray-600">Let's set up your cannabis profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              placeholder="How should we call you?"
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              placeholder="Tell us about your cannabis journey..."
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="smokingGoal" className="block text-sm font-medium text-gray-700 mb-1">
              Cannabis Goal
            </label>
            <select
              id="smokingGoal"
              value={smokingGoal}
              onChange={(e) => setSmokingGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            >
              <option value="">Select a goal...</option>
              <option value="medical">Medical use</option>
              <option value="recreational">Recreational enjoyment</option>
              <option value="social">Social sessions</option>
              <option value="wellness">Wellness & relaxation</option>
              <option value="track">Track my usage</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sage-600 text-white py-2 px-4 rounded-md hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating Profile..." : "Join PuffBuddy"}
          </button>
        </form>
      </div>
    </div>
  );
}
