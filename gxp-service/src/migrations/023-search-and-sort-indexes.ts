import { QueryInterface } from "sequelize";

/**
 * Same problem as lims-service's 013-search-and-sort-indexes: every list endpoint here
 * does `ORDER BY created_at DESC` plus `ILIKE '%term%'` search with no supporting index
 * — fine today, but it's the same full-sort/full-scan trap once these tables have real
 * volume (see the LIMS testing session this mirrors). Adding it now costs nothing and
 * heads it off before it's ever user-visible here.
 */

interface TableIndexSpec {
  table: string;
  sortColumn: string;
  searchColumns: string[];
}

const SPECS: TableIndexSpec[] = [
  { table: "app_modules", sortColumn: "created_at", searchColumns: ["module_name"] },
  { table: "applications", sortColumn: "created_at", searchColumns: ["application_name", "application_id"] },
  { table: "assignment_groups", sortColumn: "created_at", searchColumns: ["group_name", "description"] },
  { table: "environments", sortColumn: "created_at", searchColumns: ["environment_name", "description"] },
  { table: "service_requests", sortColumn: "created_at", searchColumns: ["service_request_id", "short_description", "description"] },
  { table: "suppliers", sortColumn: "created_at", searchColumns: ["supplier_name", "description"] },
  { table: "gxp_users", sortColumn: "created_at", searchColumns: ["user_name", "description"] },
  { table: "workflows", sortColumn: "created_at", searchColumns: ["workflow_name", "description"] }
];

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  for (const { table, sortColumn, searchColumns } of SPECS) {
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS ${table}_${sortColumn}_idx ON ${table} (${sortColumn})`
    );

    for (const column of new Set(searchColumns)) {
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS ${table}_${column}_trgm_idx ON ${table} USING GIN (${column} gin_trgm_ops)`
      );
    }
  }
};
