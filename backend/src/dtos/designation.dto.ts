import { IsString, IsOptional, IsEnum, IsMongoId } from "class-validator";

export class CreateDesignationDto {
  @IsString()
  readonly designationName!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  readonly designationName?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}

export class IsValidParamsIdDto {
  @IsMongoId({ message: "Id must be valid" })
  readonly id!: string;
}
