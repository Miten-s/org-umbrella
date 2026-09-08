/** LIMS Customer types (STANDARDS.md §1). See LIMS_BACKEND_SPEC.md §5. */

export interface LimsRef {
  id: string;
  name?: string;
}

export interface LimsAttachment {
  id: string;
  attachment: string;
  comment?: string;
}

export interface LimsAddress {
  line1?: string;
  line2?: string;
  town?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface LimsCustomer {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  customerId: string;
  customerName: string;
  description?: string;
  group?: LimsRef | null;
  rating?: LimsRef | null;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  address?: LimsAddress;
  otherInformation?: string;
  linkedProjects?: LimsRef[];
  attachments?: LimsAttachment[];
  isRemoved?: boolean;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
}

export interface LimsCustomerPayload {
  customerId: string;
  customerName: string;
  description?: string;
  group?: string;
  rating?: string;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  address?: LimsAddress;
  otherInformation?: string;
  keptAttachmentIds?: string[];
  changeReason?: string;
}
