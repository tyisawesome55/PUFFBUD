import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const MOODS = ["😊 Happy", "😌 Relaxed", "🤔 Focused", "😴 Sleepy", "🎉 Euphoric", "😐 Neutral"];
const METHODS = ["Joint", "Pipe", "Bong", "Vape", "Edible", "Dab"];

export function LogPuff() {
  const [cigarettes, setCigarettes] = useState(1);
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("");
  const [strain, setStrain] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const logPuff = useMutation(api.smoking.logPuff);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      await logPuff({
        cigarettes,
        location: location.trim() || undefined,
        mood: mood || undefined,
        notes: notes.trim() || undefined,
        method: method || undefined,
        strain: strain.trim() || undefined,
      });

      // Reset form
      setCigarettes(1);
      setLocation("");
      setMood("");
      setNotes("");
      setMethod("");
      setStrain("");

      toast.success("Puff logged! 🌿");
    } catch (error) {
      toast.error("Failed to log puff");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">Log a Puff 🌿</h2>
          <p className="text-sage-100 text-center text-sm mt-1">Track your cannabis journey</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Number of cigarettes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many hits/puffs?
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setCigarettes(Math.max(1, cigarettes - 1))}
                className="w-10 h-10 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center hover:bg-sage-200 transition-colors font-bold text-lg"
              >
                -
              </button>
              <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                {cigarettes}
              </span>
              <button
                type="button"
                onClick={() => setCigarettes(cigarettes + 1)}
                className="w-10 h-10 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center hover:bg-sage-200 transition-colors font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method (optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(method === m ? "" : m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    method === m
                      ? "bg-sage-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Strain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strain (optional)
            </label>
            <input
              type="text"
              value={strain}
              onChange={(e) => setStrain(e.target.value)}
              placeholder="e.g., Blue Dream, OG Kush..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you smoking?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling? (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? "" : m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mood === m
                      ? "bg-sage-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts or observations..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLogging}
            className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-sage-700 hover:to-sage-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            {isLogging ? "Logging..." : "Log Puff 🌿"}
          </button>
        </form>
      </div>
    </div>
  );
}
