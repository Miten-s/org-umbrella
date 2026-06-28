import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches
} from "class-validator";

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// To Validate the Request Body While Creating a New Department
export class CreateDepartmentDto {
  @IsString({ message: "Location name is required and must be a string." })
  readonly departmentName!: string;

  @IsString({ message: "Location manager is required and must be a string." })
  @Matches(uuidRegex, { message: "Id must be valid" })
  readonly departmentManager!: string;

  @IsString({ message: "Location is required and must be a string." })
  @Matches(uuidRegex, { message: "Id must be valid" })
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
  @Matches(uuidRegex, { message: "Id must be valid" })
  readonly departmentManager?: string;

  @IsOptional()
  @Matches(uuidRegex, { message: "Id must be valid" })
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
