import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  workflowName!: string;

  @IsInt()
  @Min(1)
  numberOfLevels!: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  levels!: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  levels?: string[];

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}