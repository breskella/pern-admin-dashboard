import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { UploadWidgetValue } from "@/types";

interface UploadWidgetProps {
    value?: UploadWidgetValue | null;
    onChange: (value: UploadWidgetValue | null) => void;
    disabled?: boolean;
}

const UploadWidget = ({ value = null, onChange, disabled = false }: UploadWidgetProps) => {
    const widgetRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const [preview, setPreview] = useState<UploadWidgetValue | null>(value);
    const [deleteToken, setDeleteToken] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        setPreview(value);
        if (!value) setDeleteToken(null);
    }, [value]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initializeWidget = () => {
            if (!window.cloudinary || widgetRef.current) return false;

            widgetRef.current = window.cloudinary.createUploadWidget(
                {
                    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                    multiple: false,
                    folder: 'uploads',
                    maxFileSize: 5000000,
                    clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
                },
                (error: any, result: any) => {
                    if (!error && result && result.event === "success") {
                        const payload: UploadWidgetValue = {
                            url: result.info.secure_url,
                            publicId: result.info.public_id,
                        };

                        setPreview(payload);
                        setDeleteToken(result.info.delete_token ?? null);
                        onChangeRef.current(payload);
                    }
                }
            );
            return true;
        };

        if (initializeWidget()) return;

        const timer = setInterval(() => {
            if (initializeWidget()) {
                clearInterval(timer);
            }
        }, 500);

        return () => clearInterval(timer);
    }, []);

    const openWidget = () => {
        if (!disabled && widgetRef.current) {
            widgetRef.current.open();
        }
    };

    const removeFromCloudinary = async () => {
        if (!preview?.publicId) return;

        try {
            setIsRemoving(true);
            setPreview(null);
            setDeleteToken(null);
            onChangeRef.current(null);
        } catch (error) {
            console.error("Error removing image:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border group">
                    <img 
                        src={preview.url} 
                        alt="Upload preview" 
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        disabled={isRemoving || disabled}
                        onClick={removeFromCloudinary}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1.5 text-xs rounded-md shadow hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isRemoving ? "Removing..." : "Remove"}
                    </button>
                </div>
            ) : (
                <div 
                    role="button"
                    tabIndex={0}
                    onClick={openWidget}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            openWidget();
                        }
                    }}
                    className="upload-dropzone border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition bg-muted/30"
                >
                    <div className="upload-prompt flex flex-col items-center text-center">
                        <UploadCloud className="icon w-10 h-10 text-muted-foreground mb-2" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Click to upload photo</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadWidget;