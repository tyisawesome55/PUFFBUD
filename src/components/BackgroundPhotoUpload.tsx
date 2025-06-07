import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface BackgroundPhotoUploadProps {
  onPhotoUpdated?: () => void;
}

export function BackgroundPhotoUpload({ onPhotoUpdated }: BackgroundPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const updateBackgroundPhoto = useMutation(api.profiles.updateBackgroundPhoto);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
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
        // Set canvas to 16:9 aspect ratio (Twitter header style)
        const aspectRatio = 16 / 9;
        canvas.width = 800;
        canvas.height = 800 / aspectRatio;
        
        // Calculate crop dimensions to maintain aspect ratio
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;
        
        const imageAspectRatio = img.width / img.height;
        
        if (imageAspectRatio > aspectRatio) {
          // Image is wider than target ratio
          sourceWidth = img.height * aspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller than target ratio
          sourceHeight = img.width / aspectRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        
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

      await updateBackgroundPhoto({ backgroundId: json.storageId });
      
      toast.success("Background photo updated! 🎨");
      setShowCropper(false);
      setSelectedImage(null);
      setImagePreview(null);
      onPhotoUpdated?.();
    } catch (error) {
      toast.error("Failed to update background photo");
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
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-full hover:bg-opacity-70 transition-all duration-200 text-sm font-medium"
      >
        📷 Edit background
      </button>

      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crop Your Background</h3>
            
            <div className="mb-4">
              <div className="w-full max-w-lg mx-auto aspect-video rounded-lg overflow-hidden border-4 border-sage-200">
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Image will be cropped to fit the header area
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
                {isUploading ? "Uploading..." : "Save Background"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
