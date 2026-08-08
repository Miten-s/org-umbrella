import { Migration } from "./runner";
import * as m001 from "./001-create-audit-logs";
import * as m002 from "./002-create-phrases";
import * as m003 from "./003-create-organizational-entities";
import * as m004 from "./004-create-physical-entities";
import * as m005 from "./005-create-instrument-entities";
import * as m006 from "./006-create-analytical-entities";
import * as m007 from "./007-create-execution-entities";

export const migrations: Migration[] = [
  { name: "001-create-audit-logs", up: m001.up },
  { name: "002-create-phrases", up: m002.up },
  { name: "003-create-organizational-entities", up: m003.up },
  { name: "004-create-physical-entities", up: m004.up },
  { name: "005-create-instrument-entities", up: m005.up },
  { name: "006-create-analytical-entities", up: m006.up },
  { name: "007-create-execution-entities", up: m007.up }
];

export { runMigrations } from "./runner";
