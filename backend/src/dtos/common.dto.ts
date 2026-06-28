import { Matches } from "class-validator";

export class IsValidParamsIdDto {
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: "Id is required and must be valid"
  })
  readonly id!: string;
}
