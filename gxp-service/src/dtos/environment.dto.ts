import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { STATUS } from "../types/common.types";

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  environmentName!: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  // Status handled by defaults or separate logic?
}

export class UpdateEnvironmentDto {
  @IsString()
  @IsOptional()
  description?: string;

  // Status is usually updated via enable/disable routes, but can be here too.
  @IsString()
  @IsOptional()
  status?: string; 
}
