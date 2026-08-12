import { Migration } from "./runner";
import * as m001 from "./001-create-audit-logs";
import * as m002 from "./002-create-access-control";
import * as m003 from "./003-create-master-data";

export const migrations: Migration[] = [
  { name: "001-create-audit-logs", up: m001.up },
  { name: "002-create-access-control", up: m002.up },
  { name: "003-create-master-data", up: m003.up }
];

export { runMigrations } from "./runner";
