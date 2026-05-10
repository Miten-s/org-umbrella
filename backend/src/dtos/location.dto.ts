import { IsString, IsOptional } from "class-validator";

export class CreateLocationDto {
  @IsString()
  readonly locationName!: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly comments?: string;

  @IsString()
  readonly status?: "active" | "disabled";
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString({ message: "Location name is required and must be a string." })
  readonly description?: string;

  @IsOptional()
  @IsString({ message: "Comments is required and must be a string." })
  readonly comments?: string;

  @IsOptional()
  @IsString()
  readonly status?: "active" | "disabled";
}
