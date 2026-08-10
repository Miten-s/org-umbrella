/** Workflow module types (STANDARDS.md §1). GXP entity — served via gxpApi. */
export interface Workflow {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  workflowName: string;
  numberOfLevels?: number;
  levels?: string[];
  status?: "enabled" | "disabled";
}

export interface WorkflowPayload {
  workflowName: string;
  /** array of level labels (server rejects a bare string) */
  levels: string[];
  numberOfLevels: number;
  description?: string;
  status?: "enabled" | "disabled";
}

/** Split the comma-separated levels field into a deduped, trimmed array. */
export const parseLevels = (value: string): string[] =>
  Array.from(new Set(value.split(",").map((s) => s.trim()).filter(Boolean)));
