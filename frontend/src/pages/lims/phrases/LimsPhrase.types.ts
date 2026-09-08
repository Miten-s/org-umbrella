/** LIMS Pick List (Phrase) types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

/** One selectable value inside a pick list. */
export interface LimsPhraseEntry extends Record<string, unknown> {
  phraseEntryId?: string;
  name?: string;
  description?: string;
}

export interface LimsPhrase {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  /** Business key / code, e.g. `LOCATION_TYPE`. */
  phrase: string;
  name: string;
  description?: string;
  group?: LimsRef | null;
  /** Seeded by the backend — cannot be renamed or removed, values may be added. */
  isSystem?: boolean;
  entries?: LimsPhraseEntry[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsPhrasePayload {
  phrase: string;
  name: string;
  description?: string;
  group?: string;
  entries?: LimsPhraseEntry[];
  changeReason?: string;
}
