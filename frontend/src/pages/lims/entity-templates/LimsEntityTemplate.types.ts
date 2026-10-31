/** LIMS Entity Template types — a table plus saved conditions, reusable wherever a record is
 * picked. Queries mirror lims-service `utils/entity-query.ts`. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface QueryRule {
  field: string;
  operator: string;
  value: string;
  /** Shown for a value picked from a list; the server only reads `value`. */
  label?: string;
}

export interface QueryGroup {
  combinator: "and" | "or";
  rules: QueryNode[];
}

export type QueryNode = QueryRule | QueryGroup;

export interface LimsEntityTemplate {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  entityTemplateId: string;
  name: string;
  entity: string;
  query: QueryGroup;
  description?: string;
  group?: LimsRef | null;
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsEntityTemplatePayload {
  entityTemplateId: string;
  name: string;
  entity: string;
  query: QueryGroup;
  description?: string;
  group?: string;
  changeReason?: string;
}

export type CatalogFieldType = "ref" | "text" | "number" | "date";

export interface CatalogField {
  key: string;
  label: string;
  type: CatalogFieldType;
}

export interface CatalogTable {
  key: string;
  label: string;
  fields: CatalogField[];
}

export interface EntityCatalog {
  maxDepth: number;
  operators: Record<CatalogFieldType, string[]>;
  tables: CatalogTable[];
}

export interface EntityRecord {
  id: string;
  label: string;
}

export interface EntityRecordPage {
  data: EntityRecord[];
  total?: number;
  hasMore: boolean;
}
