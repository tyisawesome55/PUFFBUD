import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function LogSession() {
  const [amount, setAmount] = useState(1);
  const [method, setMethod] = useState("");
  const [strain, setStrain] = useState("");
  const [location, setLocation] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logSession = useMutation(api.smoking.logPuff);
  const generateUploadUrl = useMutation(api.smoking.generateUploadUrl);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLogging(true);
    try {
      let imageId = undefined;
      
      // Upload image if selected
      if (selectedImage) {
        try {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": selectedImage.type },
            body: selectedImage,
          });
          
          if (!result.ok) {
            throw new Error("Upload failed");
          }
          
          const json = await result.json();
          imageId = json.storageId;
        } catch (uploadError) {
          toast.error("Failed to upload image");
          throw uploadError;
        }
      }

      await logSession({
        cigarettes: amount,
        location: location.trim() || undefined,
        mood: moods.join(", ") || undefined,
        notes: notes.trim() || undefined,
        method: method || undefined,
        strain: strain.trim() || undefined,
        imageId: imageId,
      });
      
      // Reset form
      setAmount(1);
      setMethod("");
      setStrain("");
      setLocation("");
      setMoods([]);
      setNotes("");
      removeImage();
      
      toast.success("Session logged! 🌿");
    } catch (error) {
      toast.error("Failed to log session");
      console.error(error);
    } finally {
      setIsLogging(false);
    }
  };

  const methods = [
    { value: "joint", label: "🚬 Joint", color: "bg-sage-100 text-sage-800" },
    { value: "pipe", label: "🪈 Pipe", color: "bg-green-100 text-green-800" },
    { value: "bong", label: "💨 Bong", color: "bg-blue-100 text-blue-800" },
    { value: "vape", label: "💨 Vaporizer", color: "bg-purple-100 text-purple-800" },
    { value: "edible", label: "🍪 Edible", color: "bg-orange-100 text-orange-800" },
    { value: "dab", label: "🔥 Dab", color: "bg-red-100 text-red-800" },
  ];

  const moodOptions = [
    { value: "relaxed", label: "😌 Relaxed", color: "bg-sage-100 text-sage-800" },
    { value: "creative", label: "🎨 Creative", color: "bg-purple-100 text-purple-800" },
    { value: "social", label: "👥 Social", color: "bg-blue-100 text-blue-800" },
    { value: "focused", label: "🎯 Focused", color: "bg-green-100 text-green-800" },
    { value: "euphoric", label: "✨ Euphoric", color: "bg-yellow-100 text-yellow-800" },
    { value: "sleepy", label: "😴 Sleepy", color: "bg-indigo-100 text-indigo-800" },
    { value: "giggly", label: "😂 Giggly", color: "bg-pink-100 text-pink-800" },
    { value: "peaceful", label: "☮️ Peaceful", color: "bg-teal-100 text-teal-800" },
  ];

  const toggleMood = (mood: string) => {
    setMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">New Session 🌿</h2>
          <p className="text-sage-100 text-center text-sm mt-1">Share your cannabis experience</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How many hits/puffs?
            </label>
            <div className="flex items-center justify-center space-x-6">
              <button
                type="button"
                onClick={() => setAmount(Math.max(1, amount - 1))}
                className="w-12 h-12 rounded-full bg-sage-100 hover:bg-sage-200 flex items-center justify-center text-xl font-bold text-sage-700 transition-all duration-200 active:scale-95"
              >
                −
              </button>
              <div className="bg-sage-50 rounded-2xl px-6 py-3 min-w-[80px]">
                <span className="text-3xl font-bold text-sage-800 block text-center">
                  {amount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(amount + 1)}
                className="w-12 h-12 rounded-full bg-sage-100 hover:bg-sage-200 flex items-center justify-center text-xl font-bold text-sage-700 transition-all duration-200 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How did you consume?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((methodOption) => (
                <button
                  key={methodOption.value}
                  type="button"
                  onClick={() => setMethod(method === methodOption.value ? "" : methodOption.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                    method === methodOption.value
                      ? `${methodOption.color} border-current shadow-md scale-105`
                      : "bg-white border-gray-200 hover:border-sage-300 hover:shadow-sm"
                  }`}
                >
                  {methodOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Add a photo (optional)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Session preview" 
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all duration-200"
                  aria-label="Remove image"
                >
                  ✕
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  📷 {selectedImage?.name}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sage-400 transition-colors duration-200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-gray-500 hover:text-sage-600 transition-colors duration-200"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                    📷
                  </div>
                  <div className="text-sm font-medium">Add Photo</div>
                  <div className="text-xs text-gray-400">JPEG, PNG up to 5MB</div>
                </button>
              </div>
            )}
          </div>

          {/* Strain */}
          <div>
            <label htmlFor="strain" className="block text-sm font-semibold text-gray-700 mb-2">
              Strain (optional)
            </label>
            <input
              id="strain"
              type="text"
              value={strain}
              onChange={(e) => setStrain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
              placeholder="Blue Dream, OG Kush, etc."
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              Where? (optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200"
              placeholder="Home, park, friend's place..."
            />
          </div>

          {/* Mood - Multiple Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How are you feeling? (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {moodOptions.map((moodOption) => (
                <button
                  key={moodOption.value}
                  type="button"
                  onClick={() => toggleMood(moodOption.value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                    moods.includes(moodOption.value)
                      ? `${moodOption.color} border-current shadow-md scale-105`
                      : "bg-white border-gray-200 hover:border-sage-300 hover:shadow-sm"
                  }`}
                >
                  {moodOption.label}
                </button>
              ))}
            </div>
            {moods.length > 0 && (
              <div className="mt-2 text-xs text-sage-600">
                Selected: {moods.join(", ")}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              How was it? (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Share your experience, thoughts, or insights..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLogging}
            className="w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white py-4 px-6 rounded-xl hover:from-sage-700 hover:to-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg active:scale-98"
          >
            {isLogging ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sharing...</span>
              </div>
            ) : (
              "Share Session 🌿"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
