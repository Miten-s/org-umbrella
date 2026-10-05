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
  // Custom message: the default ("each value in ids must be a UUID") reads as a client bug
  // report, but the far more common real cause is a stale selection — a record's id changed
  // or it was removed since the list was last loaded — which the user can actually act on.
  @IsUUID("4", {
    each: true,
    message:
      "One or more selected records are out of date — refresh the page and try again."
  })
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
