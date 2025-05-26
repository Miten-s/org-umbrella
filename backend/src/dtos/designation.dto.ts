import { IsString, IsOptional, IsEnum } from "class-validator";

export class CreateDesignationDto {
  @IsString({ message: "Designation name is required and must be a string." })
  readonly designationName!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string." })
  readonly description?: string;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}
