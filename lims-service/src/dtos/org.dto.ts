import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from "class-validator";

// Customer DTOs
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {}

// Supplier DTOs
export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsUUID()
  @IsOptional()
  ratingPhraseId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {}

// Project DTOs
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateProjectDto extends CreateProjectDto {}

// Study DTOs
export class CreateStudyDto {
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}

export class UpdateStudyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;
}
