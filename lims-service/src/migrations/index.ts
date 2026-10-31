import { Migration } from "./runner";
import * as m001 from "./001-initial-schema";
import * as m002 from "./002-seed-reference-data";
import * as m003 from "./003-test-source-group";
import * as m004 from "./004-spec-limit-source-group";
import * as m005 from "./005-seed-system-pick-lists";
import * as m006 from "./006-result-row-component-type";
import * as m007 from "./007-boolean-answers-pick-list";
import * as m008 from "./008-calculation-formula-snapshot";
import * as m009 from "./009-test-repeat-number";
import * as m010 from "./010-result-verdict";
import * as m011 from "./011-result-status";
import * as m012 from "./012-sample-template-fields";

export const migrations: Migration[] = [
  { name: "001-initial-schema", up: m001.up },
  { name: "002-seed-reference-data", up: m002.up },
  { name: "003-test-source-group", up: m003.up },
  { name: "004-spec-limit-source-group", up: m004.up },
  { name: "005-seed-system-pick-lists", up: m005.up },
  { name: "006-result-row-component-type", up: m006.up },
  { name: "007-boolean-answers-pick-list", up: m007.up },
  { name: "008-calculation-formula-snapshot", up: m008.up },
  { name: "009-test-repeat-number", up: m009.up },
  { name: "010-result-verdict", up: m010.up },
  { name: "011-result-status", up: m011.up },
  { name: "012-sample-template-fields", up: m012.up }
];

export { runMigrations, checkMigrations } from "./runner";
