import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsArray } from "class-validator";

// Customer DTOs
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateCustomerDto extends CreateCustomerDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Supplier DTOs
export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsUUID()
  @IsOptional()
  ratingPhraseId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateSupplierDto extends CreateSupplierDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Project DTOs
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsOptional()
  details?: string;

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

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateProjectDto extends CreateProjectDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

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
  details?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateStudyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

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
