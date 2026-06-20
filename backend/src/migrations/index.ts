import { Migration } from "./runner";
import * as m001 from "./001-create-companies";
import * as m002 from "./002-create-permissions";
import * as m003 from "./003-create-roles";
import * as m004 from "./004-create-role-permissions";
import * as m005 from "./005-create-locations";
import * as m006 from "./006-create-departments";
import * as m007 from "./007-create-designations";
import * as m008 from "./008-create-users";
import * as m009 from "./009-add-circular-constraints";
import * as m010 from "./010-create-user-roles";
import * as m011 from "./011-create-password-history";
import * as m012 from "./012-seed-initial-data";

export const migrations: Migration[] = [
  { name: "001-create-companies", up: m001.up },
  { name: "002-create-permissions", up: m002.up },
  { name: "003-create-roles", up: m003.up },
  { name: "004-create-role-permissions", up: m004.up },
  { name: "005-create-locations", up: m005.up },
  { name: "006-create-departments", up: m006.up },
  { name: "007-create-designations", up: m007.up },
  { name: "008-create-users", up: m008.up },
  { name: "009-add-circular-constraints", up: m009.up },
  { name: "010-create-user-roles", up: m010.up },
  { name: "011-create-password-history", up: m011.up },
  { name: "012-seed-initial-data", up: m012.up }
];
export { runMigrations } from "./runner";

