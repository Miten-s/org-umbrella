const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const DEFAULT_LIST_PAGE_SIZE = 5;

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export interface PaginationMetadata {
  totalCount: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export const withDefaultListParams = (
  params: ListQueryParams = {}
): ListQueryParams => ({
  page: 1,
  limit: DEFAULT_LIST_PAGE_SIZE,
  ...params
});

export const extractList = <T,>(
  value: unknown,
  preferredKeys: string[] = []
): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of [...preferredKeys, "data", "items", "results"]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate as T[];
    }

    if (isRecord(candidate)) {
      const nestedList = extractList<T>(candidate, preferredKeys);
      if (nestedList.length) {
        return nestedList;
      }
    }
  }

  const firstArray = Object.values(value).find(Array.isArray);
  return Array.isArray(firstArray) ? (firstArray as T[]) : [];
};

export const extractPaginationMetadata = (
  value: unknown,
  fallback: Partial<PaginationMetadata> = {}
): PaginationMetadata => {
  const metadata =
    isRecord(value) && isRecord(value.metadata) ? value.metadata : undefined;
  const totalCount = Number(metadata?.totalCount ?? fallback.totalCount ?? 0);
  const limit = Number(
    metadata?.limit ?? fallback.limit ?? DEFAULT_LIST_PAGE_SIZE
  );
  const currentPage = Number(metadata?.currentPage ?? fallback.currentPage ?? 1);
  const totalPages = Number(
    metadata?.totalPages ??
      fallback.totalPages ??
      Math.ceil(totalCount / Math.max(1, limit))
  );

  return {
    totalCount,
    currentPage,
    limit,
    totalPages: Math.max(1, totalPages || 1)
  };
};
