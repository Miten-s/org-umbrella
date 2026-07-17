/** Environment module types (STANDARDS.md §1). GXP entity — served via gxpApi. */
export interface Environment {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  environmentName: string;
  description?: string;
}

export interface EnvironmentPayload {
  environmentName: string;
  description?: string;
}
