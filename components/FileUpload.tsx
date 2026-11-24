"use client";

import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
    UploadResponse,
} from "@imagekit/next";
import { useRef, useState } from "react";

interface FileUploadProps {
    onSuccess: (res: UploadResponse) => void;
    onProgress?: (percent: number) => void;
}

export default function FileUpload({ onSuccess, onProgress }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const authenticator = async () => {
        const res = await fetch("/api/auth/imagekit-auth");
        if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
        return res.json(); // { token, expire, signature, publicKey }
    };

    const handleUpload = async () => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("File must be under 5 MB");
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const { token, expire, signature, publicKey } = await authenticator();

            const res = await upload({
                file,
                fileName: file.name,
                token,
                expire,
                signature,
                publicKey,
                onProgress: (e) => onProgress?.((e.loaded / e.total) * 100),
            });

            onSuccess(res);
        } catch (err) {
            if (err instanceof ImageKitAbortError) setError("Upload aborted");
            else if (err instanceof ImageKitInvalidRequestError) setError(err.message);
            else if (err instanceof ImageKitUploadNetworkError) setError("Network error");
            else if (err instanceof ImageKitServerError) setError("ImageKit server error");
            else setError("Upload failed");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" ref={inputRef} />
            <button type="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}