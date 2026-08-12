import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string, publicId?: string) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  className,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsLoading(true);

    try {
      // Create a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        // For now, use the data URL as the image URL
        // In production, you would upload to Cloudinary or another service
        onChange?.(dataUrl, `local_${Date.now()}`);
      };
      reader.readAsDataURL(file);

      // TODO: Implement Cloudinary upload or your preferred image service
      // Example Cloudinary upload:
      // const formData = new FormData();
      // formData.append("file", file);
      // formData.append("upload_preset", "YOUR_UPLOAD_PRESET");
      //
      // const response = await fetch(
      //   "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
      //   { method: "POST", body: formData }
      // );
      // const data = await response.json();
      // setPreview(data.secure_url);
      // onChange?.(data.secure_url, data.public_id);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-input"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isLoading}
            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isLoading}
          className={cn(
            "w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition hover:border-foreground/50",
            isLoading && "opacity-50 cursor-not-allowed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <div className="animate-spin">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground" />
              <div className="text-sm text-center">
                <p className="font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
            </>
          )}
        </button>
      )}
      <p className="text-xs text-muted-foreground">
        PNG, JPG, GIF up to 5MB
      </p>
    </div>
  );
};
