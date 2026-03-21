import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  applicationName!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(["GxP", "Non-GxP"])
  applicationType!: "GxP" | "Non-GxP";

  @IsString()
  @IsOptional()
  applicationEnvironment?: string;

  @IsString()
  @IsNotEmpty()
  assignmentGroup!: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationRoles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationGroups?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationServiceRequestTypes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationModules?: string[];

  @IsString()
  @IsOptional()
  applicationWorkflow?: string;

  @IsString()
  @IsOptional()
  applicationSystemOwner?: string;

  @IsString()
  @IsOptional()
  applicationProcessOwner?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  applicationName?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["GxP", "Non-GxP"])
  applicationType?: "GxP" | "Non-GxP";

  @IsString()
  @IsOptional()
  applicationEnvironment?: string;

  @IsString()
  @IsOptional()
  assignmentGroup?: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationRoles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationGroups?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationServiceRequestTypes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicationModules?: string[];

  @IsString()
  @IsOptional()
  applicationWorkflow?: string;

  @IsString()
  @IsOptional()
  applicationSystemOwner?: string;

  @IsString()
  @IsOptional()
  applicationProcessOwner?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}
