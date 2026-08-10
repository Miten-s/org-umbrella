import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsNumber, IsDateString, IsArray } from "class-validator";

// Batch DTOs
export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  batchId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateBatchDto {
  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

// Lot DTOs
export class CreateLotDto {
  @IsUUID()
  @IsNotEmpty()
  batchId!: string;

  @IsString()
  @IsNotEmpty()
  lotId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateLotDto {
  @IsString()
  @IsOptional()
  lotId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

// Sample DTOs
export class CreateSampleDto {
  @IsUUID()
  @IsOptional()
  lotId?: string;

  @IsString()
  @IsNotEmpty()
  sampleId!: string;

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

  @IsArray()
  @IsOptional()
  attachments?: any[];
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
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
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

  @IsArray()
  @IsOptional()
  attachments?: any[];

  @IsArray()
  @IsOptional()
  testWindows?: any[];

}

export class UpdateTestDto {
  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsUUID()
  @IsOptional()
  instrumentId?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
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
  @IsString()
  @IsOptional()
  changeReason?: string;
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

export class UpdateResultDto extends CreateResultDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}
