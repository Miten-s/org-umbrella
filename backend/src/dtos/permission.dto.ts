import { IsString, IsOptional } from "class-validator";

export class CreatePermissionDto {
  @IsString()
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}
