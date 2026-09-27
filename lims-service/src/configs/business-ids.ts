import type { BusinessIdConfig } from "../utils/business-id";

/** Shared where a record is also created outside its own module (a Sample creates its Tests). */
export const TEST_BUSINESS_ID: BusinessIdConfig = {
  field: "testId",
  prefix: "TST",
  locked: true,
  pad: 10
};
