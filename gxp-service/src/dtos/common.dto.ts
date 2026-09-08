import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  ArrayMaxSize
} from "class-validator";

/** POST {route}/bulk-copy body (bulk-crud-factory's `bulkCopy`) — capped so one
 * request can't smuggle in an unbounded batch of writes. Mirrors lims-service's BulkCreateDto. */
export class BulkCreateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  records!: Record<string, any>[];
}

/** PATCH {route}/bulk-update body (bulk-crud-factory's `bulkUpdate`). Mirrors
 * lims-service's BulkUpdateDto. */
export class BulkUpdateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  updates!: { id: string; payload: Record<string, any> }[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}

/** PATCH {route}/bulk-restore body (bulk-crud-factory's `bulkRestore`). Mirrors
 * lims-service's BulkOperationDto. */
export class BulkOperationDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}
