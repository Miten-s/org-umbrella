import { IsString, IsOptional } from "class-validator";

export class CreatePermissionDto {
  @IsString({ message: "Name is required and must be a string." })
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString({ message: "Description must be a string." })
  readonly description?: string;
}
