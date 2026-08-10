import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsArray, IsIn, ValidateNested, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { ROLE_ENTRY_VALUES, RoleEntryValue } from "../models/role.model";

// ─── Group ───────────────────────────────────────────────────────────────────

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  ownedBy?: string;

  @IsUUID()
  @IsOptional()
  parentGroupId?: string;

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  ownedBy?: string;

  @IsUUID()
  @IsOptional()
  parentGroupId?: string;

  @IsString()
  @IsNotEmpty()
  changeReason!: string;
}

// ─── Role Entry ───────────────────────────────────────────────────────────────

export class RoleEntryDto {
  @IsIn([...ROLE_ENTRY_VALUES])
  entry!: RoleEntryValue;

  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @IsBoolean()
  @IsOptional()
  canRemove?: boolean;
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleEntryDto)
  @IsOptional()
  entries?: RoleEntryDto[];

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleEntryDto)
  @IsOptional()
  entries?: RoleEntryDto[];

  @IsString()
  @IsNotEmpty()
  changeReason!: string;
}

// ─── LimsUser ────────────────────────────────────────────────────────────────

export class LimsUserRefDto {
  @IsUUID()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateLimsUserDto {
  @ValidateNested()
  @Type(() => LimsUserRefDto)
  user!: LimsUserRefDto;

  @IsUUID()
  @IsOptional()
  group?: string;

  @IsUUID()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  accessGroups?: string[];

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  trainingCompleted?: boolean;

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateLimsUserDto {
  @IsUUID()
  @IsOptional()
  group?: string;

  @IsUUID()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  accessGroups?: string[];

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  trainingCompleted?: boolean;

  @IsString()
  @IsNotEmpty()
  changeReason!: string;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export class CreateSchedulerDto {
  @IsString()
  @IsNotEmpty()
  schedulerId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  analysisId?: string;

  @IsUUID()
  @IsOptional()
  testGroupId?: string;

  @IsUUID()
  @IsOptional()
  specificationId?: string;

  @IsUUID()
  @IsOptional()
  sampleTypeId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  planTime?: string;

  @IsNumber()
  @IsOptional()
  leadTimeValue?: number;

  @IsString()
  @IsOptional()
  leadTimeUnit?: string;

  @IsString()
  @IsOptional()
  lastRunDate?: string;

  @IsString()
  @IsOptional()
  nextRunDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  autoLogin?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateSchedulerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  analysisId?: string;

  @IsUUID()
  @IsOptional()
  testGroupId?: string;

  @IsUUID()
  @IsOptional()
  specificationId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  planTime?: string;

  @IsNumber()
  @IsOptional()
  leadTimeValue?: number;

  @IsString()
  @IsOptional()
  leadTimeUnit?: string;

  @IsBoolean()
  @IsOptional()
  autoLogin?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  changeReason!: string;
}
