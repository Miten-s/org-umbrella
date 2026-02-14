import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

// Application Module DTO
export class CreateAppModuleDto {
  @IsString()
  @IsNotEmpty()
  moduleName!: string;

  @IsString()
  @IsOptional()
  @IsEnum(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}

// Application Group DTO
export class CreateAppGroupDto {
  @IsString()
  @IsNotEmpty()
  appId!: string;

  @IsString()
  @IsNotEmpty()
  appGroup!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

// Request Type DTO
export class CreateRequestTypeDto {
  @IsString()
  @IsNotEmpty()
  requestType!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
