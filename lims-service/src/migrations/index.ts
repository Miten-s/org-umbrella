import { Migration } from "./runner";
import * as m001 from "./001-initial-schema";
import * as m002 from "./002-seed-reference-data";
import * as m003 from "./003-test-source-group";
import * as m004 from "./004-spec-limit-source-group";
import * as m005 from "./005-seed-system-pick-lists";
import * as m006 from "./006-result-row-component-type";

export const migrations: Migration[] = [
  { name: "001-initial-schema", up: m001.up },
  { name: "002-seed-reference-data", up: m002.up },
  { name: "003-test-source-group", up: m003.up },
  { name: "004-spec-limit-source-group", up: m004.up },
  { name: "005-seed-system-pick-lists", up: m005.up },
  { name: "006-result-row-component-type", up: m006.up }
];

export { runMigrations, checkMigrations } from "./runner";
