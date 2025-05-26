import { IsMongoId } from "class-validator";

export class IsValidParamsIdDto {
  @IsMongoId({ message: "Id is required and must be valid" })
  readonly id!: string;
}
