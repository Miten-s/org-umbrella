import type { NavItem } from "./navConfig";

export type PageEntry = { name: string; path: string; context: string };

export const flattenNav = (items: NavItem[]): PageEntry[] => {
  const pages: PageEntry[] = [];
  const seen = new Set<string>();
  const add = (name: string, path: string, context: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    pages.push({ name, path, context });
  };
  for (const item of items) {
    if (item.path) add(item.name, item.path, item.name);
    item.subItems?.forEach((sub) => add(sub.name, sub.path, item.name));
    item.groups?.forEach((group) =>
      group.subItems.forEach((sub) =>
        add(sub.name, sub.path, `${item.name} · ${group.name}`)
      )
    );
  }
  return pages;
};

const isSubsequence = (needle: string, hay: string) => {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
};

/** Lower is better; null means no match. "stk bat" matches "Stock Batches". */
const scorePage = (page: PageEntry, query: string): number | null => {
  const name = page.name.toLowerCase();
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  const words = `${name} ${page.context.toLowerCase()}`.split(/[\s·]+/);
  const tokens = query.split(/\s+/).filter(Boolean);
  const allMatch = tokens.every((token) =>
    words.some((word) => word.includes(token) || isSubsequence(token, word))
  );
  return allMatch ? 2 : null;
};

export const searchPages = (pages: PageEntry[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return pages;
  return pages
    .map((page) => ({ page, score: scorePage(page, q) }))
    .filter((r): r is { page: PageEntry; score: number } => r.score !== null)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.page);
};
