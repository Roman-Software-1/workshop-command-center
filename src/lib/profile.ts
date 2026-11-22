import { z } from "zod";

export const profileInput = z.object({
  display_name: z.string().trim().min(1, "Enter a display name.").max(80, "Use 80 characters or fewer."),
  avatar_url: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Use an HTTPS image URL, or leave it blank."),
});