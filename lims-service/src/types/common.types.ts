export type AppError = {
  message: string;
  statusCode?: number;
  stack?: string;
  [key: string]: any;
};

/** {id, name} — the nested-relation shape the frontend expects everywhere (spec §3). */
export type Ref = { id: string; name?: string } | null;
