// lib/telegram.ts

// These should be in your environment variables
// Note: In client-side code, we are calling a Next.js API route to protect these tokens,
// but for the upload function used in the Admin Component, we can use a server action or API route.
// For simplicity in this Serverless setup, we will create a helper function that calls the Telegram API.

/**
 * Uploads a file to Telegram and returns the direct download URL.
 * NOTE: This exposes the Bot Token if run on the client side.
 * For production security, this logic should be inside an API Route (/api/upload).
 * However, for this implementation, we will use an API Route approach.
 */
export async function uploadImageToTelegram(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload to Telegram");
  }

  const data = await response.json();
  return data.url;
}
