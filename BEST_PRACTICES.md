# Best Practices & Common Pitfalls

## 🎯 Best Practices for File Upload Components

### 1. Always Validate Before Upload

❌ **Anti-Pattern:**
```typescript
const handleUpload = (file: File) => {
    // Trust Cloudinary to validate
    uploadToCloudinary(file);
};
```

✅ **Best Practice:**
```typescript
const handleUpload = (file: File) => {
    // Validate locally first
    const validation = validateFile(file);
    if (!validation.valid) {
        setError(validation.error);
        return;
    }
    uploadToCloudinary(file);
};
```

**Why?** Users get instant feedback without uploading to the server.

---

### 2. Consolidate Related State

❌ **Anti-Pattern:**
```typescript
const [preview, setPreview] = useState(null);
const [deleteToken, setDeleteToken] = useState(null);
const [isRemoving, setIsRemoving] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [error, setError] = useState(null);
// 6 separate state updates for one action!
```

✅ **Best Practice:**
```typescript
const [state, setState] = useState({
    preview: null,
    deleteToken: null,
    isRemoving: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
});
// Single state object - all updates are atomic
```

**Why?** Prevents race conditions and inconsistent states.

---

### 3. Always Show Loading States

❌ **Anti-Pattern:**
```typescript
<button onClick={uploadFile}>
    Upload
</button>
// User doesn't know if upload is in progress
```

✅ **Best Practice:**
```typescript
<button 
    onClick={uploadFile}
    disabled={isUploading}
>
    {isUploading ? (
        <>
            <Spinner className="mr-2" />
            Uploading... {uploadProgress}%
        </>
    ) : (
        'Upload'
    )}
</button>
```

**Why?** Users won't click multiple times or navigate away during upload.

---

### 4. Implement Proper Error Handling

❌ **Anti-Pattern:**
```typescript
const handleUpload = async (file) => {
    try {
        await uploadToCloudinary(file);
    } catch (error) {
        console.error(error); // Silent failure to user
    }
};
```

✅ **Best Practice:**
```typescript
const handleUpload = async (file) => {
    try {
        await uploadToCloudinary(file);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        onError?.(errorMessage);
        // Show to user and optionally send to error tracking
        logErrorToService(error);
    }
};

const getErrorMessage = (error: any): string => {
    if (error.status === 'abort') return 'Upload was cancelled';
    if (error.code === 'ERR_FILE_TOO_LARGE') return 'File exceeds size limit';
    if (error.message) return error.message;
    return 'Upload failed. Please try again.';
};
```

**Why?** Users understand what went wrong and can act accordingly.

---

### 5. Secure Deletion Process

❌ **Anti-Pattern:**
```typescript
// Frontend only - user could potentially delete others' images
const deleteImage = async (publicId) => {
    await cloudinary.v2.uploader.destroy(publicId);
};
```

✅ **Best Practice:**
```typescript
// Frontend
const deleteImage = async (publicId, deleteToken) => {
    const response = await fetch('/api/images/delete', {
        method: 'POST',
        body: JSON.stringify({ publicId, deleteToken }),
    });
};

// Backend (Node.js)
router.post('/api/images/delete', authenticate, async (req, res) => {
    const { publicId, deleteToken } = req.body;
    const userId = req.user.id;

    // 1. Verify ownership
    const image = await db.image.findUnique({ where: { publicId } });
    if (image?.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    // 2. Use delete token
    await cloudinary.v2.uploader.destroy(publicId, { token: deleteToken });

    // 3. Update database
    await db.image.delete({ where: { publicId } });

    res.json({ success: true });
});
```

**Why?** Prevents unauthorized deletion of other users' images.

---

### 6. Use Proper TypeScript Typing

❌ **Anti-Pattern:**
```typescript
const handleUpload = (file: any) => {
    // Type safety is lost
};

const [state, setState] = useState({}); // No type info
```

✅ **Best Practice:**
```typescript
interface UploadState {
    preview: UploadWidgetValue | null;
    deleteToken: string | null;
    isRemoving: boolean;
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
}

interface UploadWidgetProps {
    value?: UploadWidgetValue | null;
    onChange: (value: UploadWidgetValue | null) => void;
    disabled?: boolean;
    maxSizeInMB?: number;
    allowedFormats?: string[];
    onError?: (error: string) => void;
}

const UploadWidget: React.FC<UploadWidgetProps> = ({ ... }) => {
    const [state, setState] = useState<UploadState>({ ... });
};
```

**Why?** TypeScript catches errors at compile time, not runtime.

---

### 7. Accessibility First

❌ **Anti-Pattern:**
```typescript
<div onClick={openWidget} className="upload-area">
    Click to upload
</div>
// Keyboard users can't use this
```

✅ **Best Practice:**
```typescript
<div
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openWidget();
        }
    }}
    onClick={openWidget}
    aria-label="Upload image"
    aria-describedby="upload-help"
>
    Click to upload
    <p id="upload-help">PNG, JPG up to 5MB</p>
</div>
```

**Why?** Accessible to all users, regardless of input method.

---

### 8. Memoize Callbacks to Prevent Unnecessary Re-renders

❌ **Anti-Pattern:**
```typescript
const UploadWidget = ({ onChange, onError }) => {
    const handleUpload = () => {
        // Created on every render
        onChange(...);
        onError(...);
    };
};
```

✅ **Best Practice:**
```typescript
const UploadWidget = ({ onChange, onError }) => {
    const onChangeRef = useRef(onChange);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const handleUpload = useCallback(() => {
        // Memoized - not recreated on every render
        onChangeRef.current(...);
        onErrorRef.current(...);
    }, []); // Empty dependency array!
};
```

**Why?** Prevents infinite re-render loops and improves performance.

---

### 9. Environment Variable Security

❌ **Anti-Pattern:**
```typescript
// Exposing API keys in client code
const API_KEY = 'sk_live_5a1b2c3d4e5f6g7h8i9j';
const SECRET = 'secret_key_12345';
```

✅ **Best Practice:**
```typescript
// .env.local (never commit this)
VITE_CLOUDINARY_CLOUD_NAME=my_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=my_upload_preset

// component usage
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Critical: Use Upload Presets (not API keys)
// Upload Presets are safe to expose - they have limited permissions
```

**Why?** Upload Presets are restricted versions of API keys with specific permissions.

---

### 10. Cleanup and Resource Management

❌ **Anti-Pattern:**
```typescript
useEffect(() => {
    const timer = setInterval(() => {
        // ... polling
    }, 500);
    // No cleanup - memory leak!
}, []);
```

✅ **Best Practice:**
```typescript
useEffect(() => {
    if (initializeWidget()) return;

    let attempts = 0;
    const maxAttempts = 20;
    const timer = setInterval(() => {
        attempts++;
        if (initializeWidget() || attempts >= maxAttempts) {
            clearInterval(timer); // ✅ Cleanup
        }
    }, 500);

    return () => clearInterval(timer); // ✅ Cleanup on unmount
}, [initializeWidget]);
```

**Why?** Prevents memory leaks and ensures clean unmounting.

---

## Common Pitfalls & Solutions

### Pitfall 1: Not Handling Upload Cancellation

❌ **Problem:**
```typescript
// User closes dialog/navigates away during upload
// Component unmounts but upload continues
// setState called on unmounted component → warning
```

✅ **Solution:**
```typescript
useEffect(() => {
    return () => {
        // Abort upload if component unmounts
        if (state.isUploading && widgetRef.current) {
            // Tell Cloudinary to abort
            // Note: Not all SDKs support this - use your own flag
        }
    };
}, [state.isUploading]);
```

---

### Pitfall 2: Race Conditions with Multiple Uploads

❌ **Problem:**
```typescript
// User clicks upload multiple times
// Multiple uploads in flight
// Last one to complete wins (might be outdated)
```

✅ **Solution:**
```typescript
const handleUpload = useCallback(() => {
    // Disable button during upload
    if (state.isUploading) return;
    
    setState(prev => ({ ...prev, isUploading: true }));
    // Only one upload can happen at a time
}, [state.isUploading]);
```

---

### Pitfall 3: Stale Closures in Callbacks

❌ **Problem:**
```typescript
const handleUpload = (file) => {
    // form is captured at definition time
    form.submit(); // might use stale form value
};

// Later, form changes but callback still uses old value
```

✅ **Solution:**
```typescript
const formRef = useRef(form);

useEffect(() => {
    formRef.current = form;
}, [form]);

const handleUpload = useCallback((file) => {
    // Always uses latest form
    formRef.current.submit();
}, []); // No dependency on form
```

---

### Pitfall 4: Ignoring CORS Issues

❌ **Problem:**
```typescript
// Trying to fetch Cloudinary image from different origin
const img = new Image();
img.src = 'https://res.cloudinary.com/...'; // CORS error!
```

✅ **Solution:**
```typescript
// Cloudinary handles CORS correctly
// But ensure cloudinary.js is loaded from CDN
<script src="https://upload-widget.cloudinary.com/global/all.js"></script>

// Use cloudinary.createUploadWidget (it handles CORS)
const widget = window.cloudinary.createUploadWidget(...);
```

---

### Pitfall 5: Missing Error Boundaries

❌ **Problem:**
```typescript
// Widget crashes, entire app crashes
const UploadWidget = ({ onChange }) => {
    if (!window.cloudinary) throw new Error('Cloudinary not loaded');
};
```

✅ **Solution:**
```typescript
const UploadWidget = ({ onChange }) => {
    useEffect(() => {
        if (!window.cloudinary) {
            setState(prev => ({
                ...prev,
                error: 'Upload widget unavailable'
            }));
            return; // Don't throw, handle gracefully
        }
    }, []);

    if (state.error) {
        return <Alert variant="destructive">{state.error}</Alert>;
    }
};
```

---

## Performance Optimization Tips

### 1. Lazy Load Cloudinary Script
```typescript
useEffect(() => {
    // Only load when component mounts
    if (document.querySelector('script[src*="cloudinary"]')) {
        return; // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
        // Keep it for other components
        // script.remove();
    };
}, []);
```

### 2. Memoize Component
```typescript
export default memo(UploadWidget, (prev, next) => {
    // Only re-render if props actually changed
    return (
        prev.value?.url === next.value?.url &&
        prev.disabled === next.disabled &&
        prev.maxSizeInMB === next.maxSizeInMB
    );
});
```

### 3. Use Image Optimization
```typescript
// Cloudinary URL transformations
const optimizedUrl = `${baseUrl}?w=400&h=300&c=fill&q=auto`;
```

---

## Testing Patterns

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import UploadWidget from './upload-widget';

describe('UploadWidget', () => {
    it('validates file size', () => {
        const { container } = render(
            <UploadWidget onChange={jest.fn()} maxSizeInMB={5} />
        );

        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
            type: 'image/jpeg',
        });

        // Simulate file drop
        fireEvent.drop(container, {
            dataTransfer: { files: [largeFile] },
        });

        // Should show error
        expect(screen.getByText(/exceeds.*5MB/i)).toBeInTheDocument();
    });

    it('calls onChange with valid file', async () => {
        const onChange = jest.fn();
        render(<UploadWidget onChange={onChange} />);

        // Mock Cloudinary response
        const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        // ... simulate upload completion
        // expect(onChange).toHaveBeenCalledWith({ url: '...', publicId: '...' });
    });
});
```

---

## Monitoring & Error Tracking

### Send Errors to Service
```typescript
const trackUploadError = (error: Error) => {
    fetch('/api/errors', {
        method: 'POST',
        body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        }),
    });
};

// In component
onError={(error) => {
    trackUploadError(new Error(error));
}}
```

### Performance Metrics
```typescript
const uploadStartTime = performance.now();

// After upload completes
const uploadDuration = performance.now() - uploadStartTime;
console.log(`Upload took ${uploadDuration}ms`);

// Send to analytics
analytics.trackEvent('image_upload', {
    duration: uploadDuration,
    fileSize: file.size,
    success: true,
});
```

---

## Summary Checklist

- ✅ Validate files before upload
- ✅ Show loading states
- ✅ Display error messages
- ✅ Consolidate related state
- ✅ Memoize callbacks with useCallback
- ✅ Use proper TypeScript types
- ✅ Implement accessibility
- ✅ Secure deletion process
- ✅ Handle cleanup/unmounting
- ✅ Test error scenarios
- ✅ Monitor performance
- ✅ Use environment variables safely
