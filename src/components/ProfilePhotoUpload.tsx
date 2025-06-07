import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUpdated?: () => void;
  size?: "small" | "large";
}

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoUpdated, size = "small" }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const updateProfilePhoto = useMutation(api.profiles.updateProfilePhoto);

  const sizeClasses = size === "large" 
    ? "w-32 h-32" 
    : "w-24 h-24";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const cropImage = useCallback((imageSrc: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        canvas.width = 400;
        canvas.height = 400;
        
        ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);
        
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = imageSrc;
    });
  }, []);

  const handleUpload = async () => {
    if (!selectedImage || !imagePreview) return;

    setIsUploading(true);
    try {
      const croppedBlob = await cropImage(imagePreview);
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: croppedBlob,
      });

      const json = await result.json();
      if (!result.ok) throw new Error("Upload failed");

      await updateProfilePhoto({ photoId: json.storageId });
      
      toast.success("Profile photo updated! 📸");
      setShowCropper(false);
      setSelectedImage(null);
      setImagePreview(null);
      onPhotoUpdated?.();
    } catch (error) {
      toast.error("Failed to update profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="relative group">
        <div className={`${sizeClasses} rounded-full overflow-hidden bg-white border-4 border-white shadow-lg`}>
          {currentPhotoUrl ? (
            <img 
              src={currentPhotoUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🌿</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-white text-sm font-medium">📷</span>
        </button>
      </div>

      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crop Your Photo</h3>
            
            <div className="mb-4">
              <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-sage-200">
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Image will be cropped to a circle
              </p>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? "Uploading..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
