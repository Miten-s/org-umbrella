import { PageUrl } from "@/types/utils.types";
import { Location } from "react-router-dom";


//userd when we have google analyice in the future (used in main route renderer)
export const getPageTitle = (
  location: Location<unknown>,
): string | undefined => {
  const matches: string[] = [];
  for (const key in PageUrl) {
    if (PageUrl.hasOwnProperty(key)) {
      const page = PageUrl[key];
      if (page.matchPattern.test(location.pathname)) {
        matches.push(page.pageTitle ?? '');
      }
    }
  }
  if (matches.length > 0) {
    return matches[matches.length - 1];
  } else {
    return 'Unknown';
  }
};

export const getImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const cleanPath = path.startsWith("/uploads") ? path : `/uploads${path}`;
  return `${baseUrl}${cleanPath}`;
};
