import {
  IsString,
  IsNotEmpty,
  IsArray,
  Matches,
  IsOptional
} from "class-validator";
import { Types } from "mongoose";

export class CreateRoleDto {
  @IsString({ message: "Role name is required and must be a string." })
  @IsNotEmpty({ message: "Role name cannot be empty." })
  name!: string;

  @IsArray({ message: "Permissions must be an array of valid ObjectIds." })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: "Each permission ID must be a valid MongoDB ObjectId."
  })
  permissions!: Types.ObjectId[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: "Role name must be a string." })
  name?: string;

  @IsOptional()
  @IsArray({ message: "Permissions must be an array of valid ObjectIds." })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: "Each permission ID must be a valid MongoDB ObjectId."
  })
  permissions?: Types.ObjectId[];
}
