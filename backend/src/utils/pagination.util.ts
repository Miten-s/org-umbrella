export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  search: string;
}

export const getPaginationOptions = (query: any): PaginationOptions => {
  const pageStr = query.page as string;
  const limitStr = query.limit as string;
  const search = (query.search as string) || "";

  let page = parseInt(pageStr, 10);
  if (isNaN(page) || page <= 0) {
    page = 1;
  }

  let limit = parseInt(limitStr, 10);
  if (isNaN(limit) || limit <= 0) {
    limit = 10;
  }
  if (limit > 100) {
    limit = 100; // Hard cap
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip, search };
};

export const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

/**
 * Canonical list-filter convention (BACKEND_ASKS #2).
 *
 * Clients send `?filter[<field>]=<value>` (repeat a key for array values:
 * `?filter[status]=active&filter[status]=disabled`). With the `extended` query
 * parser this arrives as `req.query.filter = { field: value | value[] }`.
 *
 * `allowedFields` is a per-endpoint whitelist so callers can only filter on
 * fields the service explicitly supports. Unknown/empty values are dropped.
 * This helper is the template every list endpoint copies.
 */
export const getListFilters = (
  query: any,
  allowedFields: string[]
): Record<string, string | string[]> => {
  const raw = query?.filter;
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const filters: Record<string, string | string[]> = {};
  for (const field of allowedFields) {
    const value = raw[field];
    if (value === undefined || value === "") continue;
    filters[field] = value;
  }
  return filters;
};
