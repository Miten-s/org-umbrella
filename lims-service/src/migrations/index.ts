import { Migration } from "./runner";
import * as m001 from "./001-create-audit-logs";
import * as m002 from "./002-create-access-control";
import * as m003 from "./003-create-master-data";
import * as m004 from "./004-create-id-sequences";
import * as m005 from "./005-create-attachments";
import * as m006 from "./006-create-master-data-2";
import * as m007 from "./007-create-instruments";
import * as m008 from "./008-create-analytical";
import * as m009 from "./009-create-executions";
import * as m010 from "./010-audit-action-cancel";
import * as m011 from "./011-widen-lims-user-signature";

export const migrations: Migration[] = [
  { name: "001-create-audit-logs", up: m001.up },
  { name: "002-create-access-control", up: m002.up },
  { name: "003-create-master-data", up: m003.up },
  { name: "004-create-id-sequences", up: m004.up },
  { name: "005-create-attachments", up: m005.up },
  { name: "006-create-master-data-2", up: m006.up },
  { name: "007-create-instruments", up: m007.up },
  { name: "008-create-analytical", up: m008.up },
  { name: "009-create-executions", up: m009.up },
  { name: "010-audit-action-cancel", up: m010.up },
  { name: "011-widen-lims-user-signature", up: m011.up }
];

export { runMigrations } from "./runner";
