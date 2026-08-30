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
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
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
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keptAttachmentIds?: string[];
}

/**
 * One row of the result-entry grid on a Sample.
 *
 * Every field a client may send has to be declared: `validateDto` runs with
 * `whitelist: true` and replaces the body with the validated instance, so an
 * undeclared property is dropped silently rather than rejected.
 */
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
// `sampleId` is absent by design: it is always server-generated and cannot be
// set or changed by a client.
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
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
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

  // The Test form's result-entry grid — was silently dropped here (whitelist
  // validation strips undeclared properties), so it never persisted despite
  // the frontend always sending it. See test.routes.ts.
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
  // New file attachments arrive on `req.files` (multer), separately from
  // this JSON payload — this is only the "which existing ones survive"
  // half of the reconcile. Declared here so `whitelist: true` doesn't
  // strip it before the controller ever sees it.
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

/**
 * A "update" to a result inserts a new version. `changeReason` is required —
 * amending a recorded measurement without saying why is the single thing a
 * GxP audit will not accept.
 */
export class UpdateResultDto {
  // The Result form's Component ID field is editable on Update too (not
  // locked, unlike the server-generated resultId), so a mistyped value can
  // be corrected on an amend. If it collides with another current Result on
  // the same Test, the partial unique index on (test_id, component_id)
  // rejects the insert — surfaced as a friendly message, not a raw error.
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
