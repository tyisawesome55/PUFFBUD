import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function Stats() {
  const stats = useQuery(api.smoking.getStats);
  const puffs = useQuery(api.smoking.getPuffs) || [];
  const deletePuff = useMutation(api.smoking.deletePuff);
  const [showPuffs, setShowPuffs] = useState(false);

  const handleDeletePuff = async (puffId: any) => {
    if (!window.confirm("Delete this puff?")) return;
    try {
      await deletePuff({ puffId });
      toast.success("Puff deleted");
    } catch (error) {
      toast.error("Failed to delete puff");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!stats) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">Loading your stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">Your Stats 📊</h2>
          <p className="text-sage-100 text-center text-sm mt-1">Track your cannabis journey</p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Today */}
          <div className="bg-sage-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-sage-600">{stats.today.cigarettes}</div>
            <div className="text-sm text-gray-600">Hits Today</div>
            <div className="text-xs text-gray-500">{stats.today.puffs} puffs</div>
          </div>

          {/* This Week */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.week.cigarettes}</div>
            <div className="text-sm text-gray-600">Hits This Week</div>
            <div className="text-xs text-gray-500">{stats.week.puffs} puffs</div>
          </div>

          {/* This Month */}
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.month.cigarettes}</div>
            <div className="text-sm text-gray-600">Hits This Month</div>
            <div className="text-xs text-gray-500">{stats.month.puffs} puffs</div>
          </div>

          {/* All Time */}
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.total.cigarettes}</div>
            <div className="text-sm text-gray-600">Total Hits</div>
            <div className="text-xs text-gray-500">{stats.total.puffs} puffs</div>
          </div>
        </div>

        {/* Streaks */}
        <div className="px-6 pb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Streaks 🔥</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.streaks.current}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
              <div className="text-xs text-gray-500">days</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.streaks.longest}</div>
              <div className="text-sm text-gray-600">Longest Streak</div>
              <div className="text-xs text-gray-500">days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Puffs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Puffs</h3>
          <button
            onClick={() => setShowPuffs(!showPuffs)}
            className="text-sage-600 text-sm font-medium hover:text-sage-700 transition-colors"
          >
            {showPuffs ? "Hide" : "Show All"}
          </button>
        </div>

        {showPuffs && (
          <div className="max-h-96 overflow-y-auto">
            {puffs.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🌿</div>
                <p className="text-gray-500">No puffs logged yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {puffs.map((puff) => (
                  <div key={puff._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {puff.cigarettes} hits
                          </span>
                          {puff.method && (
                            <span className="bg-sage-100 text-sage-700 px-2 py-1 rounded-full text-xs font-medium">
                              {puff.method}
                            </span>
                          )}
                          {puff.strain && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              {puff.strain}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(puff.timestamp)}
                          {puff.location && ` • ${puff.location}`}
                          {puff.mood && ` • ${puff.mood}`}
                        </div>
                        {puff.notes && (
                          <p className="text-sm text-gray-500 mt-1">{puff.notes}</p>
                        )}
                        {puff.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={puff.imageUrl} 
                              alt="Session photo" 
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => puff.imageUrl && window.open(puff.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePuff(puff._id)}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
