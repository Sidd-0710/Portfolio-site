/**
 * The deployed site's absolute origin, for metadataBase, the sitemap, robots
 * and share images. Set NEXT_PUBLIC_SITE_URL once there's a custom domain;
 * until then Vercel's production URL (set automatically) is used.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
