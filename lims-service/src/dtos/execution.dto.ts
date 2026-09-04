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

/** Batches, Lots, Samples, Tests, Results and Schedulers. */

export class CancelDto {
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Batches ────────────────────────────────────────────────────────────────
export class CreateBatchDto {
  @IsOptional() @IsString() @MaxLength(100) batchId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) batchName!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  /** Lots to attach to this batch; replaces the current set. */
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) lots?: string[];
}
export class UpdateBatchDto {
  @IsOptional() @IsString() @MaxLength(100) batchId?: string;
  @IsOptional() @IsString() @MaxLength(200) batchName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) lots?: string[];
  @IsOptional() @IsString() changeReason?: string;
  // New files arrive on `req.files` separately; this is only the "which existing ones survive" half.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

// ─── Lots ───────────────────────────────────────────────────────────────────
export class CreateLotDto {
  @IsOptional() @IsString() @MaxLength(100) lotId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) lotName!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") batch?: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) samples?: string[];
}
export class UpdateLotDto {
  @IsOptional() @IsString() @MaxLength(100) lotId?: string;
  @IsOptional() @IsString() @MaxLength(200) lotName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") batch?: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) samples?: string[];
  @IsOptional() @IsString() changeReason?: string;
  // New files arrive on `req.files` separately; this is only the "which existing ones survive" half.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

/** One row of the result-entry grid on a Sample. Every field a client may send must be
 * declared — `whitelist: true` drops undeclared properties silently. */
export class TestWindowRowDto {
  @IsOptional() @IsUUID("4") testId?: string;
  @IsOptional() @IsString() @MaxLength(200) analysisName?: string;
  @IsOptional() @IsString() @MaxLength(100) componentId?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsBoolean() outOfRange?: boolean;
  @IsOptional() @IsDateString() enteredOn?: string;
  @IsOptional() @IsString() @MaxLength(200) enteredBy?: string;
  /** The grid sends these under the relation's own name. */
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") stock?: string;
  @IsOptional() @IsUUID("4") instrumentId?: string;
  @IsOptional() @IsUUID("4") stockId?: string;
}

// ─── Samples ────────────────────────────────────────────────────────────────
// `sampleId` is absent by design — always server-generated, never client-set.
export class CreateSampleDto {
  @IsOptional() @IsString() @MaxLength(255) idText?: string;
  @IsOptional() @IsString() @MaxLength(200) sampleName?: string;
  @IsOptional() @IsUUID("4") lot?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsUUID("4") sampleType?: string;
  @IsOptional() @IsUUID("4") specification?: string;
  @IsOptional() @IsUUID("4") testGroup?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsUUID("4") stockBatch?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() @MaxLength(150) lotNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) serialNumber?: string;
  @IsOptional() @IsDateString() loginDate?: string;
  @IsOptional() @IsString() @MaxLength(200) loginBy?: string;
  @IsOptional() @IsDateString() sampleStartDate?: string;
  @IsOptional() @IsString() @MaxLength(200) sampleStartBy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() comments?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestWindowRowDto)
  testWindows?: TestWindowRowDto[];
}
export class UpdateSampleDto extends CreateSampleDto {
  @IsOptional() @IsString() changeReason?: string;
  // New files arrive on `req.files` separately; this is only the "which existing ones survive" half.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

// ─── Tests ──────────────────────────────────────────────────────────────────
export class CreateTestDto {
  @IsUUID("4") sample!: string;
  @IsOptional() @IsString() @MaxLength(200) testName?: string;
  @IsOptional() @IsUUID("4") analysis?: string;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsInt() replicateCount?: number;
  @IsOptional() @IsDateString() loginDate?: string;
  @IsOptional() @IsString() @MaxLength(200) loginBy?: string;
  @IsOptional() @IsString() description?: string;

  // The Test form's result-entry grid — was silently dropped by whitelist validation, so it never persisted.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestWindowRowDto)
  components?: TestWindowRowDto[];
}
export class UpdateTestDto {
  @IsOptional() @IsString() @MaxLength(200) testName?: string;
  @IsOptional() @IsUUID("4") analysis?: string;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsInt() replicateCount?: number;
  @IsOptional() @IsDateString() loginDate?: string;
  @IsOptional() @IsString() @MaxLength(200) loginBy?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() changeReason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestWindowRowDto)
  components?: TestWindowRowDto[];
  // New files arrive on `req.files` separately; this is only the "which existing ones survive" half.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

// ─── Results ────────────────────────────────────────────────────────────────
export class CreateResultDto {
  @IsUUID("4") test!: string;
  @IsOptional() @IsString() @MaxLength(100) componentId?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsBoolean() outOfRange?: boolean;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") stock?: string;
  @IsOptional() @IsDateString() enteredOn?: string;
  @IsOptional() @IsString() @MaxLength(200) enteredBy?: string;
  @IsOptional() @IsUUID("4") group?: string;
}

/** An "update" to a result inserts a new version. `changeReason` is required — amending a
 * recorded measurement without saying why is the one thing a GxP audit will not accept. */
export class UpdateResultDto {
  // componentId is editable on Update (unlike the locked resultId), so a mistyped value
  // can be corrected — a collision hits the (test_id, component_id) partial unique index.
  @IsOptional() @IsString() @MaxLength(100) componentId?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsBoolean() outOfRange?: boolean;
  @IsOptional() @IsUUID("4") instrument?: string;
  @IsOptional() @IsUUID("4") stock?: string;
  @IsOptional() @IsDateString() enteredOn?: string;
  @IsOptional() @IsString() @MaxLength(200) enteredBy?: string;

  @IsString()
  @IsNotEmpty({ message: "A change reason is required to amend a result" })
  changeReason!: string;
}

// ─── Schedulers ─────────────────────────────────────────────────────────────
export class CreateSchedulerDto {
  @IsOptional() @IsString() @MaxLength(100) schedulerId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(50) scope?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsUUID("4") analysis?: string;
  @IsOptional() @IsUUID("4") testGroup?: string;
  @IsOptional() @IsUUID("4") specification?: string;
  @IsOptional() @IsUUID("4") sampleType?: string;
  @IsOptional() @IsUUID("4") owner?: string;
  @IsOptional() @IsString() @MaxLength(50) plan?: string;
  @IsOptional() @IsString() @MaxLength(20) planTime?: string;
  @IsOptional() @IsInt() leadTimeValue?: number;
  @IsOptional() @IsString() @MaxLength(20) leadTimeUnit?: string;
  @IsOptional() @IsDateString() nextRunDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() autoLogin?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateSchedulerDto extends CreateSchedulerDto {
  @IsOptional() @IsString() changeReason?: string;
}
