import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
  @IsString()
  @IsNotEmpty({ message: "Every component needs a Component ID" })
  @MaxLength(100)
  componentId!: string;
  // Name/Description are required per row by `validateComponents` — rows saved before
  // component types existed are accepted untouched even without them.
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

/** One Test Group row — nothing but the Test Template it includes. */
export class TestRowDto {
  @IsUUID("4", { message: "Every test needs a Test Template" })
  analysisId!: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class LimitRowDto {
  /** Echoed back for saved rows — how an unchanged legacy (free-text) row is recognised. */
  @IsOptional() @IsUUID("4") id?: string;
  @IsOptional() @IsString() @MaxLength(200) analysisName?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  // Set only when populated via the Limits grid's Analysis/Component picker.
  @IsOptional() @IsUUID("4") analysisId?: string;
  @IsOptional() @IsUUID("4") componentId?: string;
  @IsOptional() @IsUUID("4") sourceTestGroupId?: string;
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

/** Test Groups and/or Test Templates to expand for a sample's test picker. */
export class ExpandTestSourcesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID("4", { each: true })
  testGroupIds?: string[];

  // Higher than groups: a Specification's editor resolves every template it already carries.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID("4", { each: true })
  analysisIds?: string[];

  /** Also return each template's components (type, unit, list, default limits). */
  @IsOptional() @IsBoolean() includeComponents?: boolean;
}
