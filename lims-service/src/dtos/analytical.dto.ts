import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsNumber } from "class-validator";

// Analysis DTOs
export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  version?: number;

  @IsUUID()
  @IsOptional()
  approvalStatusPhraseId?: string;

  @IsString()
  @IsOptional()
  sopReference?: string;

  @IsUUID()
  @IsOptional()
  inspectionPlanId?: string;
}

export class UpdateAnalysisDto extends CreateAnalysisDto {}

// Analysis Component DTOs
export class CreateAnalysisComponentDto {
  @IsUUID()
  @IsNotEmpty()
  analysisId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  componentTypePhraseId!: string;

  @IsUUID()
  @IsOptional()
  unitPhraseId?: string;

  @IsInt()
  @IsNotEmpty()
  sortOrder!: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class UpdateAnalysisComponentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  componentTypePhraseId?: string;

  @IsUUID()
  @IsOptional()
  unitPhraseId?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

// Test Group DTOs
export class CreateTestGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTestGroupDto extends CreateTestGroupDto {}

// Test Group Item DTOs
export class CreateTestGroupItemDto {
  @IsUUID()
  @IsNotEmpty()
  testGroupId!: string;

  @IsUUID()
  @IsNotEmpty()
  analysisId!: string;

  @IsInt()
  @IsNotEmpty()
  sortOrder!: number;
}

export class UpdateTestGroupItemDto {
  @IsUUID()
  @IsOptional()
  analysisId?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

// Specification DTOs
export class CreateSpecificationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  version?: number;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateSpecificationDto extends CreateSpecificationDto {}

// Spec Limit DTOs
export class CreateSpecLimitDto {
  @IsUUID()
  @IsNotEmpty()
  specificationId!: string;

  @IsUUID()
  @IsNotEmpty()
  analysisComponentId!: string;

  @IsNumber()
  @IsOptional()
  minValue?: number;

  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @IsString()
  @IsOptional()
  targetText?: string;

  @IsBoolean()
  @IsOptional()
  targetBoolean?: boolean;
}

export class UpdateSpecLimitDto {
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @IsString()
  @IsOptional()
  targetText?: string;

  @IsBoolean()
  @IsOptional()
  targetBoolean?: boolean;
}
