import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

/** Analyses, Test Groups and Specifications. Component/limit rows are intentionally
 * permissive — which fields matter depends on the row's `type`. */

export class ComponentRowDto {
  @IsOptional() @IsString() @MaxLength(100) componentId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(50) type?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsString() calculation?: string;
  @IsOptional() @IsString() formula?: string;
  @IsOptional() @IsString() @MaxLength(255) option?: string;
  @IsOptional() @IsString() list?: string;
  @IsOptional() @IsString() @MaxLength(150) entity?: string;
  @IsOptional() @IsString() entityCriteria?: string;
  @IsOptional() @IsString() @MaxLength(100) min?: string;
  @IsOptional() @IsString() @MaxLength(100) max?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class TestRowDto {
  @IsOptional() @IsString() @MaxLength(200) testName?: string;
  @IsOptional() @IsString() @MaxLength(150) instrumentCategory?: string;
  @IsOptional() @IsString() @MaxLength(150) instrumentType?: string;
  /** The grid sends the picked instrument under its own name. */
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") instrumentId?: string;
  @IsOptional() @IsInt() replicateCount?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class LimitRowDto {
  @IsOptional() @IsString() @MaxLength(200) analysisName?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  // Set only when populated via the Limits grid's Analysis/Component picker.
  @IsOptional() @IsUUID("4") analysisId?: string;
  @IsOptional() @IsUUID("4") componentId?: string;
  @IsOptional() @IsString() @MaxLength(100) min?: string;
  @IsOptional() @IsString() @MaxLength(100) max?: string;
  @IsOptional() @IsString() @MaxLength(255) text?: string;
  @IsOptional() @IsString() @MaxLength(255) phrase?: string;
  @IsOptional() @IsString() @MaxLength(20) boolean?: string;
  @IsOptional() @IsString() calculation?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

// ─── Analyses ───────────────────────────────────────────────────────────────

export class CreateAnalysisDto {
  @IsOptional() @IsString() @MaxLength(100) analysisId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsOptional() @IsUUID("4") analysisType?: string;
  @IsOptional() @IsUUID("4") approvalStatus?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") inspectionPlan?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentRowDto)
  components?: ComponentRowDto[];
}

export class UpdateAnalysisDto {
  @IsOptional() @IsString() @MaxLength(100) analysisId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsUUID("4") analysisType?: string;
  @IsOptional() @IsUUID("4") approvalStatus?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") inspectionPlan?: string;
  @IsOptional() @IsString() @MaxLength(200) sopReference?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentRowDto)
  components?: ComponentRowDto[];

  @IsOptional() @IsString() changeReason?: string;
}

// ─── Test Groups ────────────────────────────────────────────────────────────

export class CreateTestGroupDto {
  @IsOptional() @IsString() @MaxLength(100) testGroupId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestRowDto)
  tests?: TestRowDto[];
}

export class UpdateTestGroupDto {
  @IsOptional() @IsString() @MaxLength(100) testGroupId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestRowDto)
  tests?: TestRowDto[];

  @IsOptional() @IsString() changeReason?: string;
}

// ─── Specifications ─────────────────────────────────────────────────────────

export class CreateSpecificationDto {
  @IsOptional() @IsString() @MaxLength(100) specId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LimitRowDto)
  limits?: LimitRowDto[];
}

export class UpdateSpecificationDto {
  @IsOptional() @IsString() @MaxLength(100) specId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LimitRowDto)
  limits?: LimitRowDto[];

  @IsOptional() @IsString() changeReason?: string;
  // New files arrive on `req.files` separately; this is only the "which existing ones survive" half.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}
