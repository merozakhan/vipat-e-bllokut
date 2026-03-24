/**
 * Cloudinary Image Storage for Railway Deployment
 * 
 * Replaces Manus S3 storage. Downloads images from external URLs
 * and uploads them to Cloudinary for permanent, reliable hosting.
 * 
 * Free tier: 25GB storage, 25GB bandwidth/month
 * 
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from "cloudinary";

let configured = false;

// Gold VBO logo watermark — centered, large, semi-transparent PNG
const WATERMARK_OVERLAY = {
  overlay: "vipat-assets:vipat-watermark",
  gravity: "center",
  width: 500,
  opacity: 40,
};

function ensureConfigured(): boolean {
  if (configured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("[Cloudinary] Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
  console.log("[Cloudinary] Configured for cloud:", cloudName);
  return true;
}

/**
 * Upload an image from a URL to Cloudinary.
 * Returns the permanent Cloudinary URL, or null if upload fails.
 */
export async function uploadImageFromUrl(imageUrl: string, folder: string = "vipat-articles"): Promise<string | null> {
  if (!ensureConfigured()) return null;

  try {
    // First download the image ourselves to bypass hotlink protection
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return null;
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": parsedUrl.origin + "/",
        "Origin": parsedUrl.origin,
      },
      signal: AbortSignal.timeout(30000),
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`[Cloudinary] Failed to download image (${response.status}): ${imageUrl.substring(0, 80)}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Skip if image is too small (likely a tracking pixel or placeholder)
    if (buffer.byteLength < 1000) {
      return null;
    }

    // Upload buffer to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { quality: "auto", fetch_format: "auto" },
            WATERMARK_OVERLAY,
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log(`[Cloudinary] Uploaded: ${result.public_id} (${Math.round(buffer.byteLength / 1024)}KB)`);
    return result.secure_url;
  } catch (error: any) {
    console.warn(`[Cloudinary] Upload error: ${error?.message || error}`);
    return null;
  }
}

/**
 * Upload a base64 image to Cloudinary (for manual article posting via API).
 */
export async function uploadImageBase64(base64Data: string, filename: string, folder: string = "vipat-articles"): Promise<string | null> {
  if (!ensureConfigured()) return null;

  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder,
        public_id: filename,
        resource_type: "image",
        transformation: [WATERMARK_OVERLAY],
      }
    );
    return result.secure_url;
  } catch (error: any) {
    console.warn(`[Cloudinary] Base64 upload error: ${error?.message || error}`);
    return null;
  }
}

/**
 * Upload any file (image or video) to the media library folder.
 */
export async function uploadMediaBase64(
  base64Data: string,
  filename: string,
  resourceType: "image" | "video" = "image"
): Promise<{ url: string; publicId: string; type: string; bytes: number; width?: number; height?: number; format: string; createdAt: string } | null> {
  if (!ensureConfigured()) return null;

  try {
    const prefix = resourceType === "video" ? "data:video/mp4;base64," : "data:image/jpeg;base64,";
    const result = await cloudinary.uploader.upload(
      `${prefix}${base64Data}`,
      {
        folder: "vipat-media",
        public_id: filename,
        resource_type: resourceType,
      }
    );
    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
      createdAt: result.created_at,
    };
  } catch (error: any) {
    console.warn(`[Cloudinary] Media upload error: ${error?.message || error}`);
    return null;
  }
}

/**
 * List all media files from the media library folder.
 */
export async function listMedia(maxResults: number = 100, nextCursor?: string): Promise<{
  files: { url: string; publicId: string; type: string; bytes: number; width?: number; height?: number; format: string; createdAt: string }[];
  nextCursor?: string;
  totalCount: number;
}> {
  if (!ensureConfigured()) return { files: [], totalCount: 0 };

  try {
    const options: any = {
      type: "upload",
      prefix: "vipat-media",
      max_results: maxResults,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    };

    // Fetch images
    const imgResult = await cloudinary.api.resources({ ...options, resource_type: "image" });
    // Fetch videos
    let vidResult: any = { resources: [] };
    try {
      vidResult = await cloudinary.api.resources({ ...options, resource_type: "video" });
    } catch { /* no videos yet */ }

    const allResources = [...(imgResult.resources || []), ...(vidResult.resources || [])];

    // Sort by created_at desc
    allResources.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const files = allResources.map((r: any) => ({
      url: r.secure_url,
      publicId: r.public_id,
      type: r.resource_type,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      format: r.format,
      createdAt: r.created_at,
    }));

    // Also fetch from vipat-articles folder
    const artResult = await cloudinary.api.resources({
      type: "upload",
      prefix: "vipat-articles",
      max_results: maxResults,
      resource_type: "image",
    });
    const artFiles = (artResult.resources || []).map((r: any) => ({
      url: r.secure_url,
      publicId: r.public_id,
      type: r.resource_type,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      format: r.format,
      createdAt: r.created_at,
    }));

    const combined = [...files, ...artFiles];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      files: combined.slice(0, maxResults),
      nextCursor: imgResult.next_cursor,
      totalCount: combined.length,
    };
  } catch (error: any) {
    console.warn(`[Cloudinary] List error: ${error?.message || error}`);
    return { files: [], totalCount: 0 };
  }
}

/**
 * Delete a media file from Cloudinary.
 */
export async function deleteMedia(publicId: string, resourceType: "image" | "video" = "image"): Promise<boolean> {
  if (!ensureConfigured()) return false;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error: any) {
    console.warn(`[Cloudinary] Delete error: ${error?.message || error}`);
    return false;
  }
}
