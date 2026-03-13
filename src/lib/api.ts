import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = "https://api.almostcrackd.ai";

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Pipeline API endpoints
export const pipelineApi = {
  generatePresignedUrl: (contentType: string) =>
    apiFetch<{ presignedUrl: string; cdnUrl: string }>(
      "/pipeline/generate-presigned-url",
      {
        method: "POST",
        body: JSON.stringify({ contentType }),
      }
    ),

  uploadImageFromUrl: (imageUrl: string, isCommonUse: boolean = false) =>
    apiFetch<{ imageId: string; now: number }>(
      "/pipeline/upload-image-from-url",
      {
        method: "POST",
        body: JSON.stringify({ imageUrl, isCommonUse }),
      }
    ),

  generateCaptions: (imageId: string, humorFlavorId?: number) =>
    apiFetch<unknown[]>("/pipeline/generate-captions", {
      method: "POST",
      body: JSON.stringify({
        imageId,
        ...(humorFlavorId && { humorFlavorId }),
      }),
    }),
};

// Helper to upload an image file through the pipeline
export async function uploadImageToPipeline(
  file: File
): Promise<{ imageId: string; cdnUrl: string }> {
  // Step 1: Get presigned URL
  const { presignedUrl, cdnUrl } = await pipelineApi.generatePresignedUrl(
    file.type
  );

  // Step 2: Upload to S3
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new ApiError("Failed to upload image to S3", uploadResponse.status);
  }

  // Step 3: Register with pipeline
  const { imageId } = await pipelineApi.uploadImageFromUrl(cdnUrl, false);

  return { imageId, cdnUrl };
}
