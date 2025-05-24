import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMongoId
} from "class-validator";

// To Validate the Request Body While Creating a New Department
export class CreateDepartmentDto {
  @IsString()
  readonly departmentName!: string;

  @IsMongoId()
  readonly departmentManager!: string;

  @IsString()
  readonly departmentGroupLocation!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly createdBy?: string;

  @IsOptional()
  @IsDateString()
  readonly createdOn?: Date;

  @IsOptional()
  @IsDateString()
  readonly modifiedOn?: Date;

  @IsOptional()
  @IsString()
  readonly modifiedBy?: string;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}

// To Validate the Request Body While Updating a New Department
export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  readonly departmentName?: string;

  @IsOptional()
  @IsMongoId()
  readonly departmentManager?: string;

  @IsOptional()
  @IsString()
  readonly departmentGroupLocation?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly modifiedBy?: string;

  @IsOptional()
  @IsDateString()
  readonly modifiedOn?: Date;

  @IsOptional()
  @IsEnum(["active", "disabled"])
  readonly status?: "active" | "disabled";
}
