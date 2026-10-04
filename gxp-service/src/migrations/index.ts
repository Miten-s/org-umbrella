import { Migration } from "./runner";
import * as m001 from "./001-initial-schema";
import * as m002 from "./002-seed-reference-data";

export const migrations: Migration[] = [
  { name: "001-initial-schema", up: m001.up },
  { name: "002-seed-reference-data", up: m002.up }
];

export { runMigrations, checkMigrations } from "./runner";
