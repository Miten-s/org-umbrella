import { http, HttpResponse } from "msw";
import {
  createRow,
  duplicateRows,
  getAudit,
  listEntities,
  queryList,
  restoreRow,
  softDelete,
  updateRow
} from "./db";
import { phraseEntries, registerLimsFixtures } from "./fixtures";

registerLimsFixtures();

/** Host-agnostic so the same handlers work in dev and in vitest. */
const url = (path: string) => `*/${path}`;

const readListArgs = (request: Request) => {
  const params = new URL(request.url).searchParams;
  return {
    page: Number(params.get("page") ?? 1),
    limit: Number(params.get("limit") ?? 10),
    search: params.get("search") ?? undefined,
    includeRemoved: params.get("includeRemoved") === "true",
    sortBy: params.get("sortBy") ?? undefined,
    sortDir: (params.get("sortDir") as "asc" | "desc" | null) ?? undefined
  };
};

const notFound = () => HttpResponse.json({ message: "Not found" }, { status: 404 });

const readBody = async (request: Request): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    // Matches the gxp-service convention: record JSON under `data`, files aside.
    const form = await request.formData();
    const data = form.get("data");
    return typeof data === "string" ? JSON.parse(data) : {};
  }
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
};

/**
 * The ten endpoints from LIMS_BACKEND_SPEC.md §2, generated for every registered
 * entity. Specific paths are registered before `/:id` so they win the match.
 */
const entityHandlers = listEntities().flatMap((entity) => {
  const route = entity.route;

  return [
    http.get(url(`${route}/:id/audit`), ({ params }) =>
      HttpResponse.json({ audit: getAudit(route, String(params.id)) })
    ),

    http.post(url(`${route}/bulk-delete`), async ({ request }) => {
      const body = await readBody(request);
      const ids = (body.ids as string[]) ?? [];
      const count = softDelete(entity, ids, body.changeReason as string | undefined);
      return HttpResponse.json({ message: "Removed", count });
    }),

    http.post(url(`${route}/bulk-duplicate`), async ({ request }) => {
      const body = await readBody(request);
      const count = duplicateRows(entity, (body.ids as string[]) ?? []);
      return HttpResponse.json({ message: "Copied", count });
    }),

    http.patch(url(`${route}/restore/:id`), async ({ params, request }) => {
      const body = await readBody(request);
      const row = restoreRow(entity, String(params.id), body.changeReason as string | undefined);
      return row ? HttpResponse.json(row) : notFound();
    }),

    http.get(url(route), ({ request }) => {
      const { rows, metadata } = queryList(entity, readListArgs(request));
      return HttpResponse.json({ [entity.dataKey]: rows, metadata });
    }),

    http.post(url(route), async ({ request }) =>
      HttpResponse.json(createRow(entity, await readBody(request)), { status: 201 })
    ),

    http.get(url(`${route}/:id`), ({ params }) => {
      const row = entity.rows.find((r) => r.id === String(params.id));
      return row ? HttpResponse.json({ data: row }) : notFound();
    }),

    http.patch(url(`${route}/:id`), async ({ params, request }) => {
      const row = updateRow(entity, String(params.id), await readBody(request));
      return row ? HttpResponse.json(row) : notFound();
    }),

    http.delete(url(`${route}/:id`), async ({ params, request }) => {
      const body = await readBody(request);
      const count = softDelete(entity, [String(params.id)], body.changeReason as string | undefined);
      return count ? HttpResponse.json({ message: "Removed" }) : notFound();
    })
  ];
});

/** Pick-list values — registered ahead of the generic `/lims-phrases/:id`. */
const phraseEntriesHandler = http.get(url("lims-phrases/entries"), ({ request }) => {
  const params = new URL(request.url).searchParams;
  const phrase = params.get("phrase") ?? "";
  const search = (params.get("search") ?? "").toLowerCase();

  const entries = (phraseEntries[phrase] ?? []).filter((entry) =>
    search ? String(entry.name ?? "").toLowerCase().includes(search) : true
  );

  return HttpResponse.json({
    entries,
    metadata: {
      totalCount: entries.length,
      currentPage: 1,
      limit: Math.max(entries.length, 1),
      totalPages: 1
    }
  });
});

export const limsHandlers = [phraseEntriesHandler, ...entityHandlers];
