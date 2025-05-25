import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  Matches
} from "class-validator";
import { Types } from "mongoose";

export class CreateUserDTO {
  @IsString({ message: "Username is required and must be a string." })
  @MinLength(3, { message: "Username must be at least 3 characters long." })
  username!: string;

  @IsEmail({}, { message: "Invalid email address." })
  email!: string;

  @IsString({ message: "Name is required and must be a string." })
  name!: string;

  @IsString({ message: "Password is required and must be a string." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;

  @IsOptional()
  @IsArray({ message: "Roles must be an array of role IDs." })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: "Each role ID must be a valid MongoDB ObjectId."
  })
  roles?: Types.ObjectId[];
}

export class UpdateUserDTO {
  @IsOptional()
  @IsString({ message: "Username must be a string." })
  @MinLength(3, { message: "Username must be at least 3 characters long." })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email address." })
  email?: string;

  @IsOptional()
  @IsString({ message: "Name must be a string." })
  name?: string;

  @IsOptional()
  @IsString({ message: "Password must be a string." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password?: string;

  @IsOptional()
  @IsArray({ message: "Roles must be an array of role IDs." })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    each: true,
    message: "Each role ID must be a valid MongoDB ObjectId."
  })
  roles?: Types.ObjectId[];
}
