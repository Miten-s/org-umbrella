import { PageUrl } from "@/types/utils.types";
import { Location } from "react-router-dom";

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

export const getImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9002/v1/api";;
  const assetBaseUrl = baseUrl
    ?.replace(/\/v\d+\/api\/?$/, "")
    .replace(/\/$/, "");
  const cleanPath = path.startsWith("/uploads") ? path : `/uploads${path}`;

  return assetBaseUrl ? `${assetBaseUrl}${cleanPath}` : cleanPath;
};

export const getGxpImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;

  if (/^https?:\/\//i.test(path)) return path;

  // Must match the gxp axios base (gxp.axios.interceptor.ts): the var is
  // VITE_API_GXP_BASE_URL (not VITE_GXP_API_BASE_URL), with the same localhost
  // fallback. Without this, the URL was built relative and 404'd on :3000.
  const baseUrl =
    import.meta.env.VITE_API_GXP_BASE_URL ?? "http://localhost:9001/v1/api";
  const assetBaseUrl = baseUrl
    ?.replace(/\/v\d+\/api\/?$/, "")
    .replace(/\/$/, "");
  const cleanPath = path.startsWith("/uploads") ? path : `/uploads${path}`;

  return assetBaseUrl ? `${assetBaseUrl}${cleanPath}` : cleanPath;
};
