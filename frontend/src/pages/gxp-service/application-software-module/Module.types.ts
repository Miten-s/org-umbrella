/** Application/Software Module types (STANDARDS.md §1). GXP entity — gxpApi. */
export interface ApplicationRef {
  id: string;
  _id: string;
  applicationName?: string;
}

export interface ApplicationSoftwareModule {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  moduleName: string;
  moduleId?: string;
  application?: ApplicationRef | string | null;
  status?: "enabled" | "disabled";
}

export interface ModulePayload {
  moduleName: string;
  application?: string;
  status?: "enabled" | "disabled";
}

/** application id from a module row (ref object or bare id). Ported verbatim. */
export const getModuleApplicationId = (module?: ApplicationSoftwareModule | null): string => {
  const app = module?.application;
  if (!app) return "";
  if (typeof app === "string") return app;
  return app.id ?? app._id ?? "";
};

export const getModuleApplicationName = (module?: ApplicationSoftwareModule | null): string => {
  const app = module?.application;
  return app && typeof app === "object" ? (app.applicationName ?? "") : "";
};

export const normalizeModuleName = (value?: string) => (value ?? "").trim().toLowerCase();
