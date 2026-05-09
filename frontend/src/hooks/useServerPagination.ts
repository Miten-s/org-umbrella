import type { AppDataTableServerPagination } from "@/components/common/table/AppDataTable";
import {
  DEFAULT_LIST_PAGE_SIZE,
  ListQueryParams,
  PaginationMetadata,
  extractList,
  extractPaginationMetadata
} from "@/utils/listResponse";
import {
  DependencyList,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

interface UseServerPaginationOptions<T> {
  fetchPage: (params: ListQueryParams) => Promise<unknown>;
  dataKeys?: string[];
  dependencies?: DependencyList;
  initialPageSize?: number;
  errorMessage?: string;
  mapItems?: (items: T[]) => T[];
}

const EMPTY_DATA_KEYS: string[] = [];
const EMPTY_DEPENDENCIES: DependencyList = [];

export const useServerPagination = <T>({
  fetchPage,
  dataKeys = EMPTY_DATA_KEYS,
  dependencies = EMPTY_DEPENDENCIES,
  initialPageSize = DEFAULT_LIST_PAGE_SIZE,
  errorMessage = "Failed to load records. Please try again.",
  mapItems
}: UseServerPaginationOptions<T>) => {
  const fetchPageRef = useRef(fetchPage);
  const mapItemsRef = useRef(mapItems);
  const dataKeysRef = useRef(dataKeys);
  const dataKeysKey = dataKeys.join("|");
  const dependenciesKey = dependencies
    .map((dependency) => String(dependency))
    .join("|");
  const [rows, setRows] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    totalCount: 0,
    currentPage: 1,
    limit: initialPageSize,
    totalPages: 1
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  useEffect(() => {
    mapItemsRef.current = mapItems;
  }, [mapItems]);

  useEffect(() => {
    dataKeysRef.current = dataKeys;
  }, [dataKeys, dataKeysKey]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetchPageRef.current({
          page,
          limit: pageSize,
          search: searchTerm || undefined
        });
        const nextRows = extractList<T>(response, dataKeysRef.current);
        const normalizedRows = mapItemsRef.current
          ? mapItemsRef.current(nextRows)
          : nextRows;
        const metadata = extractPaginationMetadata(response, {
          totalCount: normalizedRows.length,
          currentPage: page,
          limit: pageSize
        });

        if (cancelled) {
          return;
        }

        setRows(normalizedRows);
        setPagination(metadata);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        console.error("Server pagination fetch failed:", fetchError);
        setError(errorMessage);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    dataKeysKey,
    dependenciesKey,
    errorMessage,
    page,
    pageSize,
    refreshToken,
    searchTerm
  ]);

  const handleSearchChange = useCallback((value: string) => {
    setPage(1);
    setSearchTerm(value);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPage(1);
    setPageSize(value);
  }, []);

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const serverPagination = useMemo<AppDataTableServerPagination>(
    () => ({
      currentPage: pagination.currentPage,
      onPageChange: setPage,
      onPageSizeChange: handlePageSizeChange,
      pageSize: pagination.limit,
      totalPages: pagination.totalPages,
      totalRows: pagination.totalCount
    }),
    [handlePageSizeChange, pagination]
  );

  const tablePaginationProps = useMemo(
    () => ({
      onSearchChange: handleSearchChange,
      pageSize,
      pageSizeOptions: [5, 10, 20, 50],
      serverPagination,
      totalLabel: `${pagination.totalCount} total`
    }),
    [handleSearchChange, pageSize, pagination.totalCount, serverPagination]
  );

  return {
    rows,
    setRows,
    pagination,
    isLoading,
    error,
    setError,
    page,
    pageSize,
    searchTerm,
    setPage,
    setPageSize: handlePageSizeChange,
    setSearchTerm: handleSearchChange,
    refresh,
    serverPagination,
    tablePaginationProps
  };
};
