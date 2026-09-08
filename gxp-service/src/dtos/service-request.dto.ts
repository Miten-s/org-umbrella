import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from "class-validator";

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(["Very High", "High", "Medium", "Low"])
  priority!: "Very High" | "High" | "Medium" | "Low";

  @IsString()
  @IsNotEmpty()
  application!: string;

  @IsString()
  @IsOptional()
  assignmentGroup?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  groupLocation?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsString()
  @IsOptional()
  workflow?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modules?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notes?: string[];

  @IsString()
  @IsOptional()
  @IsEnum(["Yes", "No"])
  esignCheck?: "Yes" | "No";

  @IsBoolean()
  @IsNotEmpty()
  trainingDone!: boolean;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  shortDescription!: string;

  @IsString()
  @IsOptional()
  requestTypes?: string;
}

export class UpdateServiceRequestDto {
  @IsString()
  @IsOptional()
  @IsEnum(["Very High", "High", "Medium", "Low"])
  priority?: "Very High" | "High" | "Medium" | "Low";

  @IsString()
  @IsOptional()
  assignmentGroup?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  groupLocation?: string;

  @IsString()
  @IsOptional()
  @IsEnum([
    "New",
    "In Progress",
    "Hold",
    "Closed - Incomplete",
    "Closed - Complete",
    "Closed - Skipped"
  ])
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  comments?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @IsString()
  @IsOptional()
  requestTypes?: string;
}
