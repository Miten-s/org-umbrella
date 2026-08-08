import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString } from "class-validator";

// Location DTOs
export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  locationTypePhraseId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateLocationDto extends CreateLocationDto {}

// Stock Parameter DTOs
export class CreateStockParameterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsOptional()
  unitPhraseId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateStockParameterDto extends CreateStockParameterDto {}

// Stock DTOs
export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  stockTypePhraseId?: string;

  @IsNumber()
  @IsOptional()
  minThreshold?: number;

  @IsUUID()
  @IsOptional()
  unitPhraseId?: string;
}

export class UpdateStockDto extends CreateStockDto {}

// Stock Batch DTOs
export class CreateStockBatchDto {
  @IsUUID()
  @IsNotEmpty()
  stockId!: string;

  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @IsNotEmpty()
  initialAmount!: number;

  @IsNumber()
  @IsNotEmpty()
  currentAmount!: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsDateString()
  @IsOptional()
  receivedDate?: string;
}

export class UpdateStockBatchDto {
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

// Aliquot DTOs
export class CreateAliquotDto {
  @IsUUID()
  @IsNotEmpty()
  batchId!: string;

  @IsString()
  @IsNotEmpty()
  aliquotLabel!: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @IsNotEmpty()
  initialAmount!: number;

  @IsNumber()
  @IsNotEmpty()
  currentAmount!: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class UpdateAliquotDto {
  @IsString()
  @IsOptional()
  aliquotLabel?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
