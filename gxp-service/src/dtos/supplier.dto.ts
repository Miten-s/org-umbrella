import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsString()
  @IsOptional()
  typeOfSupplier?: string;

  @IsString()
  @IsOptional()
  product?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  typeOfSupplier?: string;

  @IsString()
  @IsOptional()
  product?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}
