# Enhanced Upload Widget - Implementation Guide

## Overview

This guide walks you through the enhancements made to the Cloudinary Upload Widget and how to integrate them into your PERN stack admin dashboard.

---

## Key Enhancements

### 1. 🔐 Security & Validation

#### Client-Side File Validation
```typescript
const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeInMB) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeInMB}MB limit...`
        };
    }

    // Check MIME type (critical!)
    if (!allowedFormats.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file format...`
        };
    }

    // Double-check extension
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => 
        fileName.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
        return { valid: false, error: `Invalid file extension...` };
    }

    return { valid: true };
}, [maxSizeInMB, allowedFormats]);
```

**Why These Validations?**
- **Size Check**: Prevents unnecessary bandwidth waste
- **MIME Type Check**: User can't rename `.exe` to `.jpg` to bypass validation
- **Extension Check**: Double security layer
- **All before sending to Cloudinary**: Better UX, faster feedback

#### Deletion Security (Backend Implementation)
```typescript
// In your backend (Node/Express example):
app.post('/api/images/delete', authenticate, async (req, res) => {
    const { publicId, deleteToken } = req.body;
    
    // IMPORTANT: Verify the delete token is valid for this image
    // Delete token should only be valid for the user who uploaded it
    const result = await cloudinary.v2.uploader.destroy(publicId, {
        token: deleteToken
    });
    
    return res.json({ success: true });
});

// Frontend: Send token to backend
const response = await fetch('/api/images/delete', {
    method: 'POST',
    body: JSON.stringify({
        publicId: state.preview.publicId,
        deleteToken: state.deleteToken
    })
});
```

---

### 2. 🎨 UI/UX Improvements

#### Upload Progress Tracking
```typescript
if (result.event === 'uploading') {
    const progress = result.info?.progress || 0;
    setState((prev) => ({
        ...prev,
        uploadProgress: progress,
    }));
}
```

Shows users real-time upload progress (0-100%).

#### Error Handling with User Feedback
```typescript
// Captured errors are displayed in an Alert component
{state.error && (
    <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
    </Alert>
)}
```

Types of errors handled:
- File validation errors (size, format)
- Cloudinary configuration errors
- Upload failures
- Widget initialization failures
- Deletion failures

#### Loading States

**During Upload:**
```typescript
{state.isUploading ? (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-white border-t-orange-500 rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">{state.uploadProgress}%</p>
        </div>
    </div>
) : null}
```

**During Removal:**
```typescript
{state.isRemoving ? (
    <div className="w-4 h-4 border-2 border-white border-t-destructive rounded-full animate-spin" />
) : (
    <X className="w-4 h-4" />
)}
```

#### Drag and Drop with Visual Feedback
```typescript
const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}, []);

const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files?.[0];
    // ... validate and upload
}, [validateFile, openWidget]);
```

CSS class to style drag-over state:
```css
.upload-dropzone.drag-over {
    @apply border-primary bg-primary/10;
}
```

#### Accessibility Improvements
```typescript
<div
    role="button"
    tabIndex={isInteractive ? 0 : -1}
    onKeyDown={(event) => {
        if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openWidget();
        }
    }}
    aria-label="Upload image area"
    aria-describedby="upload-description"
    aria-disabled={!isInteractive}
>
    <p id="upload-description" className="text-xs text-muted-foreground">
        PNG, JPG, WEBP up to 5MB
    </p>
</div>
```

**Accessibility Features:**
- ✅ Proper ARIA labels
- ✅ Keyboard navigation (Enter/Space)
- ✅ aria-disabled state
- ✅ aria-describedby for context
- ✅ Semantic markup with role="button"

---

### 3. 📝 Code Cleanliness & State Management

#### Consolidated State Management

**Before:**
```typescript
const [preview, setPreview] = useState<UploadWidgetValue | null>(value);
const [deleteToken, setDeleteToken] = useState<string | null>(null);
const [isRemoving, setIsRemoving] = useState(false);
```

**After:**
```typescript
interface UploadState {
    preview: UploadWidgetValue | null;
    deleteToken: string | null;
    isRemoving: boolean;
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
}

const [state, setState] = useState<UploadState>({
    preview: value,
    deleteToken: null,
    isRemoving: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
});
```

**Benefits:**
- Single source of truth
- Easier to manage related state
- Better for complex state transitions
- Clearer intent with named properties

#### Improved Widget Initialization
```typescript
const initializeWidget = useCallback(() => {
    if (!window.cloudinary || widgetRef.current) return false;

    try {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        // Validate config exists
        if (!cloudName || !uploadPreset) {
            const error = "Cloudinary configuration is missing";
            setState((prev) => ({ ...prev, error }));
            onErrorRef.current?.(error);
            return false;
        }

        // ... create widget
    } catch (error) {
        // Handle errors gracefully
        setState((prev) => ({ ...prev, error: errorMessage }));
    }
}, [maxSizeInMB]);
```

**Improvements:**
- ✅ Explicit error handling with try-catch
- ✅ Configuration validation
- ✅ Proper ref management for callbacks
- ✅ Better error messaging

#### useCallback for Performance
```typescript
// All event handlers are memoized to prevent unnecessary re-renders
const openWidget = useCallback(() => {
    if (disabled || state.isUploading || !widgetRef.current) return;
    setState((prev) => ({ ...prev, isUploading: true, error: null }));
    widgetRef.current.open();
}, [disabled, state.isUploading]);

const removeFromCloudinary = useCallback(async () => {
    // ... deletion logic
}, [state.preview?.publicId, state.deleteToken]);
```

#### Ref Management for Callbacks
```typescript
// Refs are updated but don't cause re-renders
const onChangeRef = useRef(onChange);
const onErrorRef = useRef(onError);

useEffect(() => {
    onChangeRef.current = onChange;
}, [onChange]);

useEffect(() => {
    onErrorRef.current = onError;
}, [onError]);

// Used in callbacks
onChangeRef.current(payload);
onErrorRef.current?.(errorMessage);
```

**Why?** Ensures callbacks always have the latest value without creating infinite loops.

---

## Integration Steps

### Step 1: Update Types (src/types/index.ts)

Add optional properties if not using the enhanced version as-is:

```typescript
export interface UploadWidgetProps {
    value?: UploadWidgetValue | null;
    onChange: (value: UploadWidgetValue | null) => void;
    disabled?: boolean;
    maxSizeInMB?: number;
    allowedFormats?: string[];
    onError?: (error: string) => void;
}
```

### Step 2: Add Alert Component

Make sure you have the Alert component:

```bash
npx shadcn-ui@latest add alert
```

### Step 3: Update Upload Widget

Replace your current upload-widget.tsx with the enhanced version.

### Step 4: Update Schema Validation (src/lib/schema.ts)

Add validation for banner URL with better error messages:

```typescript
export const classSchema = z.object({
    // ... other fields
    bannerUrl: z
        .string({ required_error: "Class banner is required" })
        .url("Invalid image URL")
        .min(1, "Class banner is required"),
    bannerCldPubId: z
        .string({ required_error: "Banner reference is required" })
        .min(1, "Banner reference is required"),
});
```

### Step 5: Update Component Usage (src/pages/classes/create.tsx)

```typescript
<FormField
    control={control}
    name="bannerUrl"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Banner Image <span className="text-orange-600">*</span></FormLabel>
            <FormControl>
                <UploadWidget
                    value={field.value ? { 
                        url: field.value, 
                        publicId: bannerPublicId ?? '' 
                    } : null}
                    onChange={(file: any) => setBannerImage(file, field)}
                    maxSizeInMB={5}
                    allowedFormats={['image/png', 'image/jpeg', 'image/webp']}
                    onError={(error) => {
                        // Handle error - could show toast notification
                        console.error('Upload error:', error);
                    }}
                    disabled={isSubmitting}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Step 6: Backend Implementation (Node.js/Express)

Implement secure image deletion:

```typescript
import cloudinary from 'cloudinary';

router.post('/api/images/delete', authenticate, async (req, res) => {
    try {
        const { publicId, deleteToken } = req.body;
        const userId = req.user.id;

        // Verify the image belongs to this user (important!)
        const image = await db.image.findUnique({
            where: { publicId },
        });

        if (!image || image.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Delete from Cloudinary using the token
        await cloudinary.v2.uploader.destroy(publicId, {
            token: deleteToken,
        });

        // Delete from database
        await db.image.delete({
            where: { publicId },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
```

---

## Testing Checklist

- [ ] File size validation works (reject > 5MB)
- [ ] MIME type validation works (only image/*)
- [ ] Extension validation works
- [ ] Error messages display correctly
- [ ] Upload progress bar shows
- [ ] Loading state works during upload
- [ ] Remove button works
- [ ] Drag-and-drop visual feedback works
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Tab index is correct when disabled
- [ ] ARIA labels are present
- [ ] Responsive on mobile
- [ ] Error state clears on successful upload
- [ ] Deletion works from Cloudinary
- [ ] Form submission includes both URL and publicId

---

## Performance Considerations

1. **Memoization**: All callbacks use useCallback to prevent unnecessary re-renders
2. **Ref Management**: onChange and onError use refs to avoid dependency issues
3. **Lazy Widget Init**: Widget loads only when needed
4. **Cleanup**: Timer is cleared on unmount
5. **State Consolidation**: Reduces number of state updates

---

## Security Summary

✅ **Client-Side:**
- MIME type validation
- File extension check
- File size validation
- Configuration validation

✅ **Server-Side (Must Implement):**
- User ownership verification
- Delete token validation
- Cloudinary API signature validation
- Rate limiting on uploads

✅ **Cloudinary Configuration:**
- Use upload presets (not API keys)
- Restrict allowed formats
- Set max file size
- Use secure URLs
- Enable resource type restrictions

---

## Future Enhancements

1. **Image Cropping**: Add capability to crop/resize before upload
2. **Multiple Uploads**: Support uploading multiple images
3. **Retry Logic**: Auto-retry failed uploads
4. **Success Toast**: Add toast notification on successful upload
5. **Image Optimization**: Suggest optimal dimensions
6. **Metadata**: Extract EXIF data or image dimensions
7. **Compression**: Client-side compression before upload
8. **Resume**: Support for resumable uploads for large files

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget not loading | Check Cloudinary config in .env |
| Upload fails silently | Check browser console for errors |
| File validation too strict | Adjust `allowedFormats` prop |
| Progress bar not showing | Ensure `isUploading` state updates |
| Drag-drop not working | Check CSS class `.upload-dropzone.drag-over` |
| Delete not working | Verify delete token from Cloudinary response |

---

## Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| File Validation | ✗ | ✓ |
| Error Messages | ✗ | ✓ |
| Upload Progress | ✗ | ✓ |
| Loading States | Partial | ✓ |
| Drag-and-Drop | ✗ | ✓ |
| Accessibility | Partial | ✓ |
| Type Safety | Good | Excellent |
| State Management | 3 states | 1 consolidated |
| Error Handling | ✗ | ✓ |
| Progress Bar | ✗ | ✓ |
| Delete Security | Partial | ✓ |

---

## Questions?

- **Why consolidate state?** Single source of truth, easier to debug, prevents state inconsistencies
- **Why MIME type check?** Security: prevents bypassing validation via file extension spoofing
- **Why send token to backend?** Ensures user can only delete their own images
- **Why use useCallback?** Prevents unnecessary re-renders and maintains referential equality
- **Why validate before upload?** Better UX: instant feedback instead of Cloudinary error
