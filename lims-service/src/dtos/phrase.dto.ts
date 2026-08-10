import { IsString, IsNotEmpty, IsOptional, IsBoolean, ValidateNested, IsArray, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class PhraseEntryDto {
  @IsString()
  @IsNotEmpty()
  entryKey!: string;

  @IsString()
  @IsNotEmpty()
  entryValue!: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreatePhraseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseEntryDto)
  @IsOptional()
  entries?: PhraseEntryDto[];
}

export class UpdatePhraseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseEntryDto)
  @IsOptional()
  entries?: PhraseEntryDto[];
  @IsString()
  @IsOptional()
  changeReason?: string;
}
