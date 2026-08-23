import { PageUrl } from "@/types/utils.types";
import { Location } from "react-router-dom";
import { BASE_URL as PLATFORM_API_BASE_URL } from "@/utils/axios.interceptor";
import { BASE_URL as GXP_API_BASE_URL } from "@/utils/gxp.axios.interceptor";
import { BASE_URL as LIMS_API_BASE_URL } from "@/utils/lims.axios.interceptor";

//userd when we have google analyice in the future (used in main route renderer)
export const getPageTitle = (
  location: Location<unknown>
): string | undefined => {
  const matches: string[] = [];
  for (const key in PageUrl) {
    if (Object.prototype.hasOwnProperty.call(PageUrl, key)) {
      const page = PageUrl[key];
      if (page.matchPattern.test(location.pathname)) {
        matches.push(page.pageTitle ?? "");
      }
    }
  }
  if (matches.length > 0) {
    return matches[matches.length - 1];
  } else {
    return "Unknown";
  }
};

/**
 * One function turns a stored file path into a fetchable URL, for every
 * service's uploads — three near-identical copies of this used to each
 * re-declare their own `VITE_API_..._BASE_URL` fallback, which is exactly
 * the kind of duplication that drifts silently (LIMS attachments were
 * pointing at gxp-service's port until that was caught). `apiBaseUrl` always
 * comes from the SAME constant that service's axios instance itself uses —
 * see the three thin wrappers below — so a production deploy changes one env
 * var per service and both the API calls and the asset URLs follow.
 */
const buildAssetUrl = (apiBaseUrl: string, path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  // A signature captured straight from a canvas (Lab Users) is a data URI,
  // not a server-stored filename — prefixing it with `/uploads` produced a
  // broken src like ".../uploads/data:image/png;base64,...". Valid as-is.
  if (/^data:/i.test(path)) return path;

  const assetBaseUrl = apiBaseUrl.replace(/\/v\d+\/api\/?$/, "").replace(/\/$/, "");
  const cleanPath = path.startsWith("/uploads") ? path : `/uploads${path}`;

  return assetBaseUrl ? `${assetBaseUrl}${cleanPath}` : cleanPath;
};

/** Platform (System IT Administration) uploads. To point at production, set VITE_API_BASE_URL. */
export const getImageUrl = (path?: string | null): string | undefined =>
  buildAssetUrl(PLATFORM_API_BASE_URL, path);

/** GXP Service uploads. To point at production, set VITE_API_GXP_BASE_URL. */
export const getGxpImageUrl = (path?: string | null): string | undefined =>
  buildAssetUrl(GXP_API_BASE_URL, path);

/** LIMS uploads. To point at production, set VITE_API_LIMS_BASE_URL. */
export const getLimsImageUrl = (path?: string | null): string | undefined =>
  buildAssetUrl(LIMS_API_BASE_URL, path);
