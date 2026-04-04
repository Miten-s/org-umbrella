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
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
