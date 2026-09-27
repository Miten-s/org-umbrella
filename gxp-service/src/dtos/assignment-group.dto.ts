import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray
} from "class-validator";
import { Type } from "class-transformer";

class UserRefDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateAssignmentGroupDto {
  @IsString()
  @IsNotEmpty()
  groupName!: string;

  @ValidateNested()
  @Type(() => UserRefDto)
  @IsNotEmpty()
  manager!: UserRefDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRefDto)
  @IsOptional()
  members?: UserRefDto[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAssignmentGroupDto {
  @IsString()
  @IsOptional()
  groupName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => UserRefDto)
  @IsOptional()
  manager?: UserRefDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRefDto)
  @IsOptional()
  members?: UserRefDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
