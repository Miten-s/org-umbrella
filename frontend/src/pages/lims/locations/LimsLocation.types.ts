/** LIMS Storage Location types (STANDARDS.md §1); named `LimsLocation` to avoid colliding
 * with the System IT Admin `Location`. */

/** A relation the list/detail endpoints return nested as `{ id, label }`. */
export interface LimsRef {
  id: string;
  /** Present depending on the relation; see the per-field reads in the form. */
  name?: string;
  locationName?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsLocation {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  locationId: string;
  locationName: string;
  description?: string;
  locationType?: LimsRef | string | null;
  group?: LimsRef | null;
  parentLocation?: LimsRef | null;
  subLocations?: LimsRef[];
  otherInformation?: string;
  attachments?: LimsAttachment[];
  status?: "enabled" | "disabled";
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

/** Body sent on create/update. Relations are id strings. */
export interface LimsLocationPayload {
  locationId: string;
  locationName: string;
  description?: string;
  locationType?: string;
  group?: string;
  parentLocation?: string;
  otherInformation?: string;
  /** Existing attachment ids to KEEP; the server deletes the rest. */
  keptAttachmentIds?: string[];
  /** Required by the audit trail on update (LIMS_BACKEND_SPEC.md §4). */
  changeReason?: string;
}
