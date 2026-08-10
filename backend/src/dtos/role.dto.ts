import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional
} from "class-validator";

export class CreateRoleDto {
  @IsString({ message: "Role name is required and must be a string." })
  @IsNotEmpty({ message: "Role name cannot be empty." })
  name!: string;

  @IsArray({ message: "Permissions must be an array of valid IDs." })
  @IsString({
    each: true,
    message: "Each permission ID must be a valid string."
  })
  permissions!: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: "Role name must be a string." })
  name?: string;

  @IsOptional()
  @IsArray({ message: "Permissions must be an array of valid IDs." })
  @IsString({
    each: true,
    message: "Each permission ID must be a valid string."
  })
  permissions?: string[];
}
