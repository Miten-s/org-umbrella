import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Customers, Suppliers, Projects, Studies, Parameters, Stock, Stock Batches
 * and Aliquots.
 *
 * Same conventions as master-data.dto.ts: field names are the client's payload
 * names, relations arrive as a bare id under the relation's own name, and
 * Update DTOs do not extend Create — PATCH is partial, and inheriting
 * `@IsNotEmpty()` would force a client to resend every required field to change
 * one of them.
 *
 * Business-ID fields (`customerId`, `projectId`, …) are optional everywhere:
 * the server generates one when the client omits it.
 */

export class AddressDto {
  @IsOptional() @IsString() @MaxLength(200) line1?: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsOptional() @IsString() @MaxLength(100) town?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(30) zipcode?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
}

/** Identity / Value / Unit — the Parameters grid on Stock and Stock Batch. */
export class ParameterValueDto {
  @IsOptional() @IsString() @MaxLength(200) identity?: string;
  @IsOptional() @IsString() @MaxLength(255) value?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export class CreateCustomerDto {
  @IsOptional() @IsString() @MaxLength(100) customerId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) customerName!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") rating?: string;
  @IsOptional() @IsString() @MaxLength(255) website?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
  @IsOptional() @IsString() otherInformation?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() @MaxLength(100) customerId?: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") rating?: string;
  @IsOptional() @IsString() @MaxLength(255) website?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
  @IsOptional() @IsString() otherInformation?: string;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Suppliers ──────────────────────────────────────────────────────────────

export class CreateSupplierDto {
  @IsOptional() @IsString() @MaxLength(100) supplierId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) supplierName!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") rating?: string;
  @IsOptional() @IsString() @MaxLength(255) website?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() @MaxLength(100) supplierId?: string;
  @IsOptional() @IsString() @MaxLength(200) supplierName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") rating?: string;
  @IsOptional() @IsString() @MaxLength(255) website?: string;
  @IsOptional() @IsString() @MaxLength(200) contactName?: string;
  @IsOptional() @IsString() @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Projects ───────────────────────────────────────────────────────────────

export class CreateProjectDto {
  @IsOptional() @IsString() @MaxLength(100) projectId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;

  @IsOptional() @IsString() @MaxLength(100) code?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") customer?: string;
  @IsOptional() @IsString() @MaxLength(200) customerContact?: string;
  @IsOptional() @IsUUID("4") supervisor?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(100) projectId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(100) code?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") customer?: string;
  @IsOptional() @IsString() @MaxLength(200) customerContact?: string;
  @IsOptional() @IsUUID("4") supervisor?: string;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Studies ────────────────────────────────────────────────────────────────

export class CreateStudyDto {
  @IsOptional() @IsString() @MaxLength(100) studyId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;

  @IsOptional() @IsString() @MaxLength(100) studyCode?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsString() projectDetails?: string;
  @IsOptional() @IsUUID("4") supervisor?: string;
}

export class UpdateStudyDto {
  @IsOptional() @IsString() @MaxLength(100) studyId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(100) studyCode?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsString() projectDetails?: string;
  @IsOptional() @IsUUID("4") supervisor?: string;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Parameters ─────────────────────────────────────────────────────────────

export class CreateParameterDto {
  @IsOptional() @IsString() @MaxLength(100) parameterId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) parameterName!: string;

  @IsOptional() @IsUUID("4") parameterType?: string;
  @IsOptional() @IsString() @MaxLength(255) defaultValue?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsUUID("4") group?: string;
}

export class UpdateParameterDto {
  @IsOptional() @IsString() @MaxLength(100) parameterId?: string;
  @IsOptional() @IsString() @MaxLength(200) parameterName?: string;
  @IsOptional() @IsUUID("4") parameterType?: string;
  @IsOptional() @IsString() @MaxLength(255) defaultValue?: string;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsString() changeReason?: string;
}

// ─── Stock ──────────────────────────────────────────────────────────────────

export class CreateStockDto {
  @IsOptional() @IsString() @MaxLength(100) stockId?: string;

  @IsString() @IsNotEmpty() @MaxLength(200) stockName!: string;

  @IsOptional() @IsUUID("4") stockType?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") operator?: string;
  @IsOptional() @IsUUID("4") defaultLocation?: string;
  @IsOptional() @IsUUID("4") preferredSupplier?: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) suppliers?: string[];
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsNumber() targetAmount?: number;
  @IsOptional() @IsNumber() lowAmount?: number;
  @IsOptional() @IsNumber() lowPercentage?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];
}

export class UpdateStockDto {
  @IsOptional() @IsString() @MaxLength(100) stockId?: string;
  @IsOptional() @IsString() @MaxLength(200) stockName?: string;
  @IsOptional() @IsUUID("4") stockType?: string;
  @IsOptional() @IsUUID("4") group?: string;
  @IsOptional() @IsUUID("4") operator?: string;
  @IsOptional() @IsUUID("4") defaultLocation?: string;
  @IsOptional() @IsUUID("4") preferredSupplier?: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) suppliers?: string[];
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsNumber() targetAmount?: number;
  @IsOptional() @IsNumber() lowAmount?: number;
  @IsOptional() @IsNumber() lowPercentage?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() details?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];

  @IsOptional() @IsString() changeReason?: string;
}

// ─── Stock Batches ──────────────────────────────────────────────────────────

export class ConsumptionDto {
  @IsOptional() @IsDateString() consumedOn?: string;
  @IsOptional() @IsString() @MaxLength(200) consumedBy?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class CreateStockBatchDto {
  /** Required: a batch cannot exist without the stock it is a batch of. */
  @IsUUID("4") stock!: string;

  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsDateString() manufacturingDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(150) supplierBatchNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) sapBatchId?: string;
  @IsOptional() @IsString() @MaxLength(150) internalBatchId?: string;
  @IsOptional() @IsNumber() initialAmount?: number;
  @IsOptional() @IsNumber() currentAmount?: number;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionDto)
  consumptions?: ConsumptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];
}

export class UpdateStockBatchDto {
  @IsOptional() @IsUUID("4") status?: string;
  @IsOptional() @IsUUID("4") project?: string;
  @IsOptional() @IsUUID("4") supplier?: string;
  @IsOptional() @IsUUID("4") location?: string;
  @IsOptional() @IsDateString() manufacturingDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(150) supplierBatchNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) sapBatchId?: string;
  @IsOptional() @IsString() @MaxLength(150) internalBatchId?: string;
  @IsOptional() @IsNumber() initialAmount?: number;
  @IsOptional() @IsNumber() currentAmount?: number;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionDto)
  consumptions?: ConsumptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterValueDto)
  parameters?: ParameterValueDto[];

  @IsOptional() @IsString() changeReason?: string;
}

// ─── Aliquots ───────────────────────────────────────────────────────────────

export class AliquotRowDto {
  @IsOptional() @IsString() @MaxLength(100) aliquotId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsString() @MaxLength(50) unit?: string;
}

export class CreateAliquotSetDto {
  @IsOptional() @IsString() @MaxLength(100) aliquotSetId?: string;

  @IsUUID("4") stockBatch!: string;

  @IsOptional() @IsInt() aliquotsNumber?: number;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliquotRowDto)
  aliquots?: AliquotRowDto[];
}

export class UpdateAliquotSetDto {
  @IsOptional() @IsString() @MaxLength(100) aliquotSetId?: string;
  @IsOptional() @IsUUID("4") stockBatch?: string;
  @IsOptional() @IsInt() aliquotsNumber?: number;
  @IsOptional() @IsUUID("4") group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliquotRowDto)
  aliquots?: AliquotRowDto[];

  @IsOptional() @IsString() changeReason?: string;
}
