import { IsUUID, IsArray, IsOptional, IsString, ArrayMinSize } from "class-validator";

export class IsValidParamsIdDto {
  @IsUUID("4", { message: "ID must be a valid UUID v4" })
  id!: string;
}

export class BulkOperationDto {
  @IsArray()
  @IsUUID("4", { each: true, message: "Each ID must be a valid UUID v4" })
  @ArrayMinSize(1, { message: "IDs array must contain at least one ID" })
  ids!: string[];

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class RestoreOperationDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}
