import crypto from "crypto";

/**
 * Generate base slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generate random 6-character suffix
 */
function generateSlugSuffix(): string {
  return crypto.randomBytes(3).toString("hex");
}

/**
 * FINAL SLUG GENERATOR
 * Example:
 * nextjs-web-development-modern-apps-a3f9c2
 */
export function createSlug(title: string): string {
  const baseSlug = generateSlug(title);
  const suffix = generateSlugSuffix();

  return `${baseSlug}-${suffix}`;
}