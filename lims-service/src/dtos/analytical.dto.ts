import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsNumber, IsArray } from "class-validator";

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

  @IsArray()
  @IsOptional()
  components?: any[];

}

export class UpdateAnalysisDto extends CreateAnalysisDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

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
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Test Group DTOs
export class CreateTestGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  testGroupItems?: any[];

}

export class UpdateTestGroupDto extends CreateTestGroupDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

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
  @IsString()
  @IsOptional()
  changeReason?: string;
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

  @IsArray()
  @IsOptional()
  attachments?: any[];

  @IsArray()
  @IsOptional()
  specLimits?: any[];

}

export class UpdateSpecificationDto extends CreateSpecificationDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

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
  @IsString()
  @IsOptional()
  changeReason?: string;
}
