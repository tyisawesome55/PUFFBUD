import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LeaderboardProps {
  onNavigateToProfile?: (userId: Id<"users">) => void;
}

export function Leaderboard({ onNavigateToProfile }: LeaderboardProps) {
  const leaderboard = useQuery(api.smoking.getLeaderboard) || [];

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
      case 2: return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-500 text-white";
      default: return "bg-gradient-to-r from-sage-400 to-sage-500 text-white";
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">Community 🏆</h2>
          <p className="text-sage-100 text-center text-sm mt-1">Most active this week</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-gray-500">No data yet. Start logging puffs to appear here!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              return (
                <div key={user.userId} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(rank)}`}>
                      {getRankEmoji(rank)}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => onNavigateToProfile && onNavigateToProfile(user.userId)}
                        className="font-semibold text-gray-900 hover:text-sage-600 transition-colors"
                      >
                        {user.displayName}
                      </button>
                      <p className="text-sm text-gray-500">{user.puffs} puffs this week</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="text-2xl">🌿</span>
                        <span className="text-xl font-bold text-gray-900">{user.cigarettes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-sage-50 text-center border-t">
          <p className="text-sm text-gray-600">
            🌿 <strong>Share your journey</strong> and connect with the community!
          </p>
        </div>
      </div>
    </div>
  );
}
