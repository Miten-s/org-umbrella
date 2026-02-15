import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested, IsArray } from "class-validator";
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
  @Matches(/^[A-Z]{2}-[A-Z]{3,}-[A-Z]{2,}-[A-Z]{2,}$/, {
    message: "Group Name must follow format like RD-APP-LIMS-BUS-ADMIN"
  })
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
