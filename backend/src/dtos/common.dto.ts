import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsObject,
  Matches
} from "class-validator";

export class IsValidParamsIdDto {
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message: "Id is required and must be valid"
    }
  )
  readonly id!: string;
}

/** POST {route}/bulk-copy body — one entry per reviewed record. */
export class BulkCreateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  records!: Record<string, any>[];
}

/** PATCH {route}/bulk-update body — one entry per reviewed, actually-changed record. */
export class BulkUpdateDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  updates!: { id: string; payload: Record<string, any> }[];
}
