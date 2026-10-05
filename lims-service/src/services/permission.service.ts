import {
  ALL_PERMISSIONS,
  LIMS_ENTITIES,
  ENTITY_LABELS,
  LIMS_ACTIONS,
  OPERATE_ALL
} from "../utils/permissions";
import { logError, logInfo } from "../configs/logger.config";
import { registerCatalogue } from "./backend-roles.client";
import { LIMS_OPERATE_ALL } from "./user-context.service";

/** LIMS's permission vocabulary is defined in its code (utils/permissions.ts) and stored
 * in backend, which holds every service's permissions. LIMS's "OPERATE:ALL" is backend's
 * "LIMS:OPERATE:ALL". */
export const toBackendPermission = (code: string) =>
  code === OPERATE_ALL ? LIMS_OPERATE_ALL : code;
export const fromBackendPermission = (name: string) =>
  name === LIMS_OPERATE_ALL ? OPERATE_ALL : name;

const RETRY_MS = 30 * 1000;

/** Sends the vocabulary to backend at every boot, so a permission added or retired in code
 * is grantable (or ungrantable) at once. Retries until backend answers. */
export const registerPermissionsWithBackend = async (): Promise<void> => {
  try {
    const result = await registerCatalogue(
      ALL_PERMISSIONS.map((p) => ({
        name: toBackendPermission(p.code),
        description: p.label
      }))
    );
    logInfo("permission catalogue registered with backend", {
      total: ALL_PERMISSIONS.length,
      ...result
    });
  } catch (error) {
    logError(
      "Could not register the permission catalogue with backend, will retry",
      { error: String(error) },
      "registerPermissionsWithBackend"
    );
    setTimeout(() => void registerPermissionsWithBackend(), RETRY_MS).unref();
  }
};

/** The catalogue, shaped for the Role form's Permissions grid: one row per entity with its
 * four actions. A permission's `id` is its code — the value a role is saved with. */
export const getPermissionCatalogue = () => ({
  entities: LIMS_ENTITIES.map((entity) => ({
    code: entity,
    label: ENTITY_LABELS[entity],
    actions: LIMS_ACTIONS
  })),
  permissions: [...ALL_PERMISSIONS]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((p) => ({
      id: p.code,
      code: p.code,
      entity: p.entity,
      action: p.action,
      label: p.label
    }))
});
