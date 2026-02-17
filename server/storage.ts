/**
 * Storage module - wraps Cloudinary for Railway deployment.
 * Replaces the original Manus S3 proxy storage.
 * 
 * Exports storagePut/storageGet for backward compatibility
 * with any code that still references them.
 */

import { uploadImageFromUrl, uploadImageBase64 } from "./cloudinaryStorage";

/**
 * Upload data to Cloudinary (backward-compatible with old S3 API).
 * For images, uploads as base64. For other data, stores as-is.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  
  // Convert to base64 and upload to Cloudinary
  let base64: string;
  if (typeof data === "string") {
    base64 = Buffer.from(data).toString("base64");
  } else {
    base64 = Buffer.from(data).toString("base64");
  }
  
  const filename = key.split("/").pop()?.replace(/\.[^.]+$/, "") || "file";
  const url = await uploadImageBase64(base64, filename);
  
  if (!url) {
    throw new Error(`Storage upload failed for key: ${key}`);
  }
  
  return { key, url };
}

/**
 * Get a URL for a stored file.
 * With Cloudinary, the URL is already public, so we just return it.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  // Cloudinary URLs are already public - no presigning needed
  const key = relKey.replace(/^\/+/, "");
  return {
    key,
    url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/vipat-articles/${key}`,
  };
}
