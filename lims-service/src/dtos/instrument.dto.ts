import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { ParameterValueDto } from "./commercial.dto";

/** Instruments, Parts, Calibrations and Inspection Plans. */

export class MaintenanceRowDto {
  @IsOptional() @IsString() @MaxLength(200) maintenanceName?: string;
  @IsOptional() @IsDateString() performedOn?: string;
  @IsOptional() @IsString() @MaxLength(200) performedBy?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class PersonnelRowDto {
  @IsOptional() @IsString() @MaxLength(50) inspectionType?: string;
  @IsOptional() @IsUUID("4") person?: string;
  @IsOptional() @IsUUID("4") role?: string;
}

// ─── Instruments ────────────────────────────────────────────────────────────

export class CreateInstrumentDto {
  @IsOptional() @IsString() @MaxLength(100) instrumentId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") type?: string;
  @IsOptional() @IsUUID("4") measurementType?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsDateString() dateInstalled?: string;
  @IsOptional() @IsDateString() lastMsaDate?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() @MaxLength(200) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(150) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) modelNumber?: string;
  @IsOptional() @IsString() measuringInformation?: string;
  @IsOptional() @IsString() msaInformation?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceRowDto)
  maintenance?: MaintenanceRowDto[];
}

export class UpdateInstrumentDto {
  @IsOptional() @IsString() @MaxLength(100) instrumentId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") type?: string;
  @IsOptional() @IsUUID("4") measurementType?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsDateString() dateInstalled?: string;
  @IsOptional() @IsDateString() lastMsaDate?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() @MaxLength(200) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(150) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) modelNumber?: string;
  @IsOptional() @IsString() measuringInformation?: string;
  @IsOptional() @IsString() msaInformation?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceRowDto)
  maintenance?: MaintenanceRowDto[];

  @IsOptional() @IsString() changeReason?: string;
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

// ─── Instrument Parts ───────────────────────────────────────────────────────

export class CreateInstrumentPartDto {
  @IsOptional() @IsString() @MaxLength(100) partId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) partName!: string;

  /** Required: a part only exists as part of an instrument. */
  @IsUUID("4") instrument!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsDateString() dateInstalled?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() @MaxLength(200) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(150) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) modelNumber?: string;
  @IsOptional() @IsString() measuringInformation?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceRowDto)
  maintenance?: MaintenanceRowDto[];
}

export class UpdateInstrumentPartDto {
  @IsOptional() @IsString() @MaxLength(100) partId?: string;
  @IsOptional() @IsString() @MaxLength(200) partName?: string;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsDateString() dateInstalled?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() @MaxLength(200) manufacturer?: string;
  @IsOptional() @IsString() @MaxLength(150) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) modelNumber?: string;
  @IsOptional() @IsString() measuringInformation?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceRowDto)
  maintenance?: MaintenanceRowDto[];

  @IsOptional() @IsString() changeReason?: string;
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

// ─── Calibrations ───────────────────────────────────────────────────────────

export class CreateCalibrationDto {
  @IsOptional() @IsString() @MaxLength(100) calibrationId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) calibrationName!: string;

  @IsUUID("4") instrument!: string;

  @IsOptional() @IsUUID("4") calibrationType?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() @MaxLength(50) plan?: string;
  @IsOptional() @IsString() @MaxLength(20) planTime?: string;
  @IsOptional() @IsInt() leadTimeValue?: number;
  @IsOptional() @IsString() @MaxLength(20) leadTimeUnit?: string;
  @IsOptional() @IsUUID("4") owner?: string;
  @IsOptional() @IsString() @MaxLength(200) contractor?: string;
  @IsOptional() @IsDateString() lastMaintenanceDate?: string;
  @IsOptional() @IsDateString() nextMaintenanceDate?: string;
  @IsOptional() @IsBoolean() autoLogin?: boolean;
}

export class UpdateCalibrationDto {
  @IsOptional() @IsString() @MaxLength(100) calibrationId?: string;
  @IsOptional() @IsString() @MaxLength(200) calibrationName?: string;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") calibrationType?: string;
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() @MaxLength(50) plan?: string;
  @IsOptional() @IsString() @MaxLength(20) planTime?: string;
  @IsOptional() @IsInt() leadTimeValue?: number;
  @IsOptional() @IsString() @MaxLength(20) leadTimeUnit?: string;
  @IsOptional() @IsUUID("4") owner?: string;
  @IsOptional() @IsString() @MaxLength(200) contractor?: string;
  @IsOptional() @IsDateString() lastMaintenanceDate?: string;
  @IsOptional() @IsDateString() nextMaintenanceDate?: string;
  @IsOptional() @IsBoolean() autoLogin?: boolean;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Inspection Plans ───────────────────────────────────────────────────────

export class CreateInspectionPlanDto {
  @IsOptional() @IsString() @MaxLength(100) inspectionId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;

  @IsOptional() @IsString() @MaxLength(50) inspectionType?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonnelRowDto)
  personnel?: PersonnelRowDto[];
}

export class UpdateInspectionPlanDto {
  @IsOptional() @IsString() @MaxLength(100) inspectionId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(50) inspectionType?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonnelRowDto)
  personnel?: PersonnelRowDto[];

  @IsOptional() @IsString() changeReason?: string;
}
