import { Migration } from "./runner";
import * as m001 from "./001-create-csv-core-schema";

export const migrations: Migration[] = [
  { name: "001-create-csv-core-schema", up: m001.up }
];

export { runMigrations, checkMigrations } from "./runner";
