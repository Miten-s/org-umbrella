export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  search: string;
}

export const getPaginationOptions = (query: any): PaginationOptions => {
  let page = parseInt(query.page as string, 10);
  if (isNaN(page) || page <= 0) page = 1;

  let limit = parseInt(query.limit as string, 10);
  if (isNaN(limit) || limit <= 0) limit = 10;
  if (limit > 200) limit = 200; // Hard cap — spec calls for high daily volume, not huge single pages.

  const skip = (page - 1) * limit;
  const search = (query.search as string) || "";

  return { page, limit, skip, search };
};

/** Standard list-endpoint query params, shared by every CRUD entity (spec §3). */
export interface ListQuery extends PaginationOptions {
  includeRemoved: boolean;
  sortBy?: string;
  sortDir: "ASC" | "DESC";
  filters: Record<string, string>;
}

export const getListQuery = (query: any): ListQuery => {
  const pagination = getPaginationOptions(query);
  const includeRemoved = query.includeRemoved === "true";
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : undefined;
  const sortDir = query.sortDir === "asc" || query.sortDir === "ASC" ? "ASC" : "DESC";

  // Express's extended query parser (see app.ts) turns `filter[name]=x` into
  // `query.filter = { name: "x" }`.
  const filters: Record<string, string> =
    query.filter && typeof query.filter === "object" ? { ...query.filter } : {};

  return { ...pagination, includeRemoved, sortBy, sortDir, filters };
};
