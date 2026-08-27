import { createClient } from "@/lib/supabase/client";

export const SCREENSHOT_BUCKET = "trade-screenshots";

export type ScreenshotSlot = "daily" | "h4" | "15m";

/**
 * Uploads a chart screenshot into the user's own folder. The bucket's RLS
 * policies require the first path segment to be the uploader's auth.uid().
 */
export async function uploadScreenshot(
  slot: ScreenshotSlot,
  file: File
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/${crypto.randomUUID()}-${slot}.${ext}`;

  const { error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;
  return path;
}

export async function removeScreenshot(path: string) {
  const supabase = createClient();
  await supabase.storage.from(SCREENSHOT_BUCKET).remove([path]);
}

export async function signScreenshot(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
