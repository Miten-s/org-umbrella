import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsNumber, IsDateString } from "class-validator";

// Batch DTOs
export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateBatchDto {
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

// Lot DTOs
export class CreateLotDto {
  @IsUUID()
  @IsNotEmpty()
  batchId!: string;

  @IsString()
  @IsNotEmpty()
  lotNumber!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateLotDto {
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

// Sample DTOs
export class CreateSampleDto {
  @IsUUID()
  @IsOptional()
  lotId?: string;

  @IsString()
  @IsNotEmpty()
  sampleNumber!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsUUID()
  @IsOptional()
  testGroupId?: string;
}

export class UpdateSampleDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsInt()
  @IsOptional()
  priority?: number;
}

// Bulk Login Sample DTO
export class BulkLoginSampleDto {
  @IsString()
  @IsNotEmpty()
  sampleNumbers!: string; // Space separated or comma separated

  @IsUUID()
  @IsOptional()
  lotId?: string;

  @IsUUID()
  @IsOptional()
  testGroupId?: string;
}

// Test DTOs
export class CreateTestDto {
  @IsUUID()
  @IsNotEmpty()
  sampleId!: string;

  @IsUUID()
  @IsNotEmpty()
  analysisId!: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsUUID()
  @IsOptional()
  instrumentId?: string;
}

export class UpdateTestDto {
  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsUUID()
  @IsOptional()
  instrumentId?: string;
}

// Test Window DTOs
export class CreateTestWindowDto {
  @IsUUID()
  @IsNotEmpty()
  testId!: string;

  @IsUUID()
  @IsNotEmpty()
  analysisComponentId!: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateTestWindowDto {
  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

// Result DTOs
export class CreateResultDto {
  @IsUUID()
  @IsNotEmpty()
  testWindowId!: string;

  @IsNumber()
  @IsOptional()
  numericValue?: number;

  @IsString()
  @IsOptional()
  textValue?: string;

  @IsBoolean()
  @IsOptional()
  booleanValue?: boolean;

  @IsDateString()
  @IsOptional()
  dateValue?: string;
}

export class UpdateResultDto extends CreateResultDto {}
