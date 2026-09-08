import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsObject
} from "class-validator";

/** POST {route}/bulk-delete and /bulk-duplicate bodies (spec §2). */
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

/** POST {route}/bulk-copy body (crud-factory's `bulkCreate`) — each entry is a full record
 * payload, capped so one request can't smuggle in an unbounded write. */
export class BulkCreateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  records!: Record<string, any>[];
}

/** PATCH {route}/bulk-update body (crud-factory's `bulkUpdate`) — each entry pairs a record
 * id with its partial payload; `changeReason` is shared across every entry's audit row. */
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

/** PATCH {route}/restore/:id body (spec §2 — restore requires a change reason). */
export class RestoreOperationDto {
  @IsOptional()
  @IsString()
  changeReason?: string;
}
