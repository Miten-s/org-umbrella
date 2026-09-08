/** Assignment Group types (STANDARDS.md §1). GXP entity — gxpApi.
 *  manager/members are stored as { userId, name } objects (not bare ids). */
export interface GroupMember {
  userId: string;
  name: string;
}

export interface AssignmentGroup {
  id: string;
  /** @deprecated compatibility shim — read `id`. */
  _id: string;
  groupName: string;
  manager?: GroupMember;
  members?: GroupMember[];
  description?: string;
  isActive?: boolean;
}

export interface AssignmentGroupPayload {
  groupName: string;
  manager: GroupMember;
  members?: GroupMember[];
  description?: string;
  isActive?: boolean;
}
