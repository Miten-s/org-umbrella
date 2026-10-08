import { useQuery } from "@tanstack/react-query";
import { fetchLimsPhraseList } from "@/pages/lims/phrases/LimsPhrase.api";

/** Every pick list with its entries, fetched once and shared by all value editors on a page. */
export const usePickLists = (enabled = true) =>
  useQuery({
    queryKey: ["limsPhrase", "all-with-entries"],
    queryFn: ({ signal }) =>
      fetchLimsPhraseList(false, { page: 1, limit: 200 }, signal),
    staleTime: 60_000,
    enabled
  });

/** One pick list's answers as dropdown options; empty while loading or for no list. */
export const usePickListOptions = (listCode?: string | null) => {
  const { data } = usePickLists(Boolean(listCode));
  if (!listCode) return [];
  return (
    data?.rows
      .find((list) => list.phrase === listCode)
      ?.entries?.map((entry) => ({
        value: String(entry.phraseEntryId ?? ""),
        label: String(entry.name ?? entry.phraseEntryId ?? "")
      }))
      .filter((option) => option.value) ?? []
  );
};
