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
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsOptional()
  @IsString()
  changeReason?: string;
}

/**
 * POST {route}/bulk-copy body — the Copy flow's single batched save (see
 * `crud-factory`'s `bulkCreate`). Each entry is a full record payload, same
 * shape a plain `create` would take; capped so one request can't be used to
 * smuggle in an unbounded write.
 */
export class BulkCreateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  records!: Record<string, any>[];
}

/** PATCH {route}/restore/:id body (spec §2 — restore requires a change reason). */
export class RestoreOperationDto {
  @IsOptional()
  @IsString()
  changeReason?: string;
}
