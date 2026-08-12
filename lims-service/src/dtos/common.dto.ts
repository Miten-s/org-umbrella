import { IsArray, IsOptional, IsString, IsUUID, ArrayNotEmpty } from "class-validator";

/** POST {route}/bulk-delete and /bulk-duplicate bodies (spec §2). */
export class BulkOperationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}

/** PATCH {route}/restore/:id body (spec §2 — restore requires a change reason). */
export class RestoreOperationDto {
  @IsOptional()
  @IsString()
  changeReason?: string;
}
