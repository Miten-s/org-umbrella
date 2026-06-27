import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  Matches,
  IsEnum,
  IsBoolean,
  ValidateIf
} from "class-validator";

export class CreateUserDTO {
  @IsString({ message: "Full Name is required and must be a string." })
  @MinLength(3, { message: "Full Name must be at least 3 characters long." })
  fullName!: string;

  @IsEmail({}, { message: "Invalid email address." })
  email!: string;

  @IsString({ message: "Name is required and must be a string." })
  name!: string;

  @IsString({ message: "Password is required and must be a string." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;

  @IsOptional()
  @IsArray({ message: "Roles must be an array of role IDs." })
  @IsString({
    each: true,
    message: "Each role ID must be a valid string ID."
  })
  roles?: string[];

  @IsEnum(["Admin", "User"], {
    message: "User type must be 'Admin' or 'User'."
  })
  userType?: "Admin" | "User";

  @IsOptional()
  @IsEnum(["active", "disabled"])
  status?: "active" | "disabled" = "active";

  @ValidateIf((obj) => obj.userType === "User")
  @IsString({ message: "Phone number is required and must be a string." })
  phone!: string;

  @ValidateIf((obj) => obj.userType === "User")
  @IsString({ message: "Department must be a valid string ID." })
  department!: string;

  @ValidateIf((obj) => obj.userType === "User")
  @IsString({ message: "Designation must be a valid string ID." })
  designation!: string;

  @ValidateIf((obj) => obj.userType === "User")
  @IsString({ message: "Location must be a valid string ID." })
  location?: string;

  @ValidateIf((obj) => obj.userType === "User")
  @IsBoolean({ message: "Modifiable must be a boolean." })
  modifiable!: boolean;

  @ValidateIf((obj) => obj.userType === "User")
  @IsBoolean({ message: "Training Completed must be a boolean." })
  trainingCompleted!: boolean;
}
