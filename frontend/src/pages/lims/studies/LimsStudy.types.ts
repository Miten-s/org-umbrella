/** LIMS Study types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsStudy {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  studyId: string;
  name: string;
  studyCode?: string;
  details?: string;
  group?: LimsRef | null;
  project?: LimsRef | null;
  /** Auto-filled from the selected project (spec §B.2.i). */
  projectDetails?: string;
  supervisor?: LimsRef | null;
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsStudyPayload {
  studyId: string;
  name: string;
  studyCode?: string;
  details?: string;
  group?: string;
  project?: string;
  projectDetails?: string;
  supervisor?: string;
  keptAttachmentIds?: string[];
  changeReason?: string;
}
