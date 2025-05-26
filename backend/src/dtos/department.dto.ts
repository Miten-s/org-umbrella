import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMongoId
} from "class-validator";

// To Validate the Request Body While Creating a New Department
export class CreateDepartmentDto {
  @IsString({ message: "Location name is required and must be a string." })
  readonly departmentName!: string;

  @IsString({ message: "Location manager is required and must be a string." })
  @IsMongoId({ message: "Id must be valid" })
  readonly departmentManager!: string;

  @IsString({ message: "Location is required and must be a string." })
  @IsMongoId({ message: "Id must be valid" })
  readonly departmentGroupLocation!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string." })
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
  @IsMongoId({ message: "Id must be valid" })
  readonly departmentManager?: string;

  @IsOptional()
  @IsMongoId({ message: "Id must be valid" })
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
