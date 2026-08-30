import { http, HttpResponse } from "msw";
import {
  bulkCreateRows,
  createRow,
  duplicateRows,
  getAudit,
  listEntities,
  queryList,
  restoreRow,
  softDelete,
  updateRow
} from "./db";
import { limsPermissionCatalog, phraseEntries, registerLimsFixtures } from "./fixtures";

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

    // The Copy flow's batched save — one request, N already-reviewed
    // records (see CopyStepper / bulkCreate in crud-factory.ts).
    http.post(url(`${route}/bulk-copy`), async ({ request }) => {
      const body = await readBody(request);
      const results = bulkCreateRows(
        entity,
        (body.records as Record<string, unknown>[]) ?? []
      );
      return HttpResponse.json(
        { message: "Copied", count: results.length, results },
        { status: 201 }
      );
    }),

    // Bulk Edit's batched save — one request, only the records the user
    // actually reviewed and changed (see EditStepper / bulkUpdate in
    // crud-factory.ts). One shared `changeReason` applied to every entry.
    http.patch(url(`${route}/bulk-update`), async ({ request }) => {
      const body = await readBody(request);
      const updates =
        (body.updates as { id: string; payload: Record<string, unknown> }[]) ?? [];
      const changeReason = body.changeReason as string | undefined;
      const results = updates.map(({ id, payload }) => {
        const updated = updateRow(entity, id, { ...payload, changeReason });
        return updated ? { id } : { id, skipped: true };
      });
      return HttpResponse.json({
        message: "Updated",
        count: results.length,
        results
      });
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

/**
 * Permission catalog — read-only, seeded by the backend. No create/update/delete:
 * roles only ever pick a subset via the Lab Roles form's PermissionPicker.
 * Registered ahead of the generic entity handlers since it isn't one.
 */
const permissionsHandler = http.get(url("lims-permissions"), ({ request }) => {
  const params = new URL(request.url).searchParams;
  const search = (params.get("search") ?? "").toLowerCase();

  const permissions = limsPermissionCatalog.filter((permission) =>
    search ? String(permission.name ?? "").toLowerCase().includes(search) : true
  );

  return HttpResponse.json({
    permissions,
    metadata: {
      totalCount: permissions.length,
      currentPage: 1,
      limit: Math.max(permissions.length, 1),
      totalPages: 1
    }
  });
});

export const limsHandlers = [phraseEntriesHandler, permissionsHandler, ...entityHandlers];
