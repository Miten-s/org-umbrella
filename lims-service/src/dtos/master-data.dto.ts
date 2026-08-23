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

/**
 * Field names here are the frontend's payload field names, verbatim. Where the
 * client sends a relation it sends a bare id under the relation's own name
 * (`group`, `parentLocation`); `relationFields` in each entity's config maps
 * that to the FK column.
 *
 * Update DTOs deliberately do NOT extend their Create counterpart: PATCH is a
 * partial update, and inheriting `@IsNotEmpty()` would force the client to
 * resend every required field to change one.
 */

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

  /**
   * Alternative flat shape: catalogue codes like "LIMS:CREATE:SAMPLE".
   * Declared so `whitelist: true` doesn't strip it before the entity's
   * normalizePayload can fold it into `entries`.
   */
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

  /**
   * Alternative flat shape: catalogue codes like "LIMS:CREATE:SAMPLE".
   * Declared so `whitelist: true` doesn't strip it before the entity's
   * normalizePayload can fold it into `entries`.
   */
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
  /**
   * The selected platform user, as the picker sends it. LIMS grants access to
   * an existing user and never creates one.
   *
   * `userId`/`userName` are the columns behind this and are accepted directly
   * too, for callers that already hold the id. The entity's `normalizePayload`
   * splits `user` into the two — and one of the two forms must be present, or
   * the row would reference nobody.
   */
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

  // No @MaxLength: this carries the signature pad's full base64 data URI
  // (easily several KB), not a filename — the 200-char cap rejected every
  // real signature outright. See migration 011 / lims-user.model.ts.
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

  // No @MaxLength: this carries the signature pad's full base64 data URI
  // (easily several KB), not a filename — the 200-char cap rejected every
  // real signature outright. See migration 011 / lims-user.model.ts.
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
