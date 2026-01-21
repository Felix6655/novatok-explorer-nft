"use client";
import { useRef, useState } from "react";

export default function MintPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setUploadError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", f);

      const res = await fetch("/api/ipfs/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!data?.ok) throw new Error(data?.error || "Upload failed");

      setImageUrl(data.url); // this becomes your tokenURI image
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">Mint NFT</h1>
      <div
        className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-zinc-400 rounded-lg cursor-pointer bg-white dark:bg-zinc-900 mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <span className="text-zinc-500">Uploading...</span>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Preview" className="max-w-full max-h-full rounded" />
        ) : (
          <span className="text-zinc-400">Click to upload image</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          className="hidden"
          onChange={onPickFile}
        />
      </div>
      {uploadError && <div className="text-red-500 mb-2">{uploadError}</div>}
      {imageUrl && <div className="text-green-600">Image uploaded!</div>}
    </div>
  );
}
