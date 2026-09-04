import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

/** Field names are the frontend's payload names verbatim; a relation arrives as a bare id
 * under its own name (`relationFields` maps it to the FK column). Update DTOs don't extend Create. */

// ─── Phrases (Pick Lists) ───────────────────────────────────────────────────

export class PhraseEntryDto {
  /** Present when editing an existing value; absent for a new one. */
  @IsOptional()
  @IsString()
  phraseEntryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePhraseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  phrase!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseEntryDto)
  entries?: PhraseEntryDto[];
}

export class UpdatePhraseDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phrase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseEntryDto)
  entries?: PhraseEntryDto[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}

// ─── Groups ─────────────────────────────────────────────────────────────────

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Platform user id of the owner. */
  @IsOptional()
  @IsString()
  ownedBy?: string;

  @IsOptional()
  @IsUUID("4")
  parentGroup?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ownedBy?: string;

  @IsOptional()
  @IsUUID("4")
  parentGroup?: string;

  @IsOptional()
  @IsString()
  changeReason?: string;
}

// ─── Roles ──────────────────────────────────────────────────────────────────

export class RoleEntryDto {
  /** Catalogue entity code, e.g. "SAMPLE". Validated against the catalogue. */
  @IsString()
  @IsNotEmpty()
  entry!: string;

  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  canRemove?: boolean;
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  roleId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleEntryDto)
  entries?: RoleEntryDto[];

  // Alternative flat shape: catalogue codes like "LIMS:CREATE:SAMPLE", folded into `entries` by normalizePayload.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleEntryDto)
  entries?: RoleEntryDto[];

  // Alternative flat shape: catalogue codes like "LIMS:CREATE:SAMPLE", folded into `entries` by normalizePayload.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}

// ─── Lab Users ──────────────────────────────────────────────────────────────

/** `{ id, name }` of the platform user the picker selected. */
export class PlatformUserRefDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class CreateLimsUserDto {
  /** The selected platform user, as the picker sends it — `userId`/`userName` are also
   * accepted directly; `normalizePayload` splits `user` into the two. */
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformUserRefDto)
  user?: PlatformUserRefDto;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  userName?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsUUID("4")
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  accessGroups?: string[];

  @IsArray()
  @IsUUID("4", { each: true })
  roles!: string[];

  // No @MaxLength: carries the signature pad's full base64 data URI (see migration 011).
  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;
}

export class UpdateLimsUserDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformUserRefDto)
  user?: PlatformUserRefDto;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsUUID("4")
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  accessGroups?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  roles?: string[];

  // No @MaxLength: carries the signature pad's full base64 data URI (see migration 011).
  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;

  @IsOptional()
  @IsString()
  changeReason?: string;
}

// ─── Locations ──────────────────────────────────────────────────────────────

export class CreateLocationDto {
  /** Optional: server generates `LOC-000001` when the client omits it. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  locationName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  locationType?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsUUID("4")
  parentLocation?: string;

  @IsOptional()
  @IsString()
  otherInformation?: string;

  @IsOptional()
  @IsIn(["enabled", "disabled"])
  status?: string;
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4")
  locationType?: string;

  @IsOptional()
  @IsUUID("4")
  group?: string;

  @IsOptional()
  @IsUUID("4")
  parentLocation?: string;

  @IsOptional()
  @IsString()
  otherInformation?: string;

  @IsOptional()
  @IsIn(["enabled", "disabled"])
  status?: string;

  @IsOptional()
  @IsString()
  changeReason?: string;
}
