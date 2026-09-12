import { QueryInterface } from "sequelize";

/**
 * All 26 LIMS list endpoints share one CRUD factory: `ORDER BY <defaultSortBy>`
 * plus `WHERE is_deleted = false`, and `ILIKE '%term%'` across each entity's
 * `searchFields`. With no supporting index, sort forces a full-table sort
 * (spilling to disk past ~100k rows) and search forces a full sequential scan
 * on every keystroke — confirmed via EXPLAIN ANALYZE at 100k/500k rows.
 *
 * Fix: a btree index on (is_deleted, sortColumn) per table so sort+filter is
 * index-served, and a pg_trgm GIN index per searched column so ILIKE '%term%'
 * can use an index instead of a seq scan.
 *
 * Not CONCURRENTLY: migrations run inside a transaction (see runner.ts), and
 * CREATE INDEX CONCURRENTLY can't run inside one. Fine for this pass; on a
 * live, already-large production table this briefly locks writes per table.
 */

interface TableIndexSpec {
  table: string;
  sortColumn: string;
  searchColumns: string[];
}

const SPECS: TableIndexSpec[] = [
  { table: "lims_aliquot_sets", sortColumn: "aliquot_set_id", searchColumns: ["aliquot_set_id"] },
  { table: "lims_analyses", sortColumn: "name", searchColumns: ["analysis_id", "name", "sop_reference", "description"] },
  { table: "lims_batches", sortColumn: "created_at", searchColumns: ["batch_id", "batch_name", "description"] },
  { table: "lims_calibrations", sortColumn: "calibration_name", searchColumns: ["calibration_id", "calibration_name", "contractor"] },
  { table: "lims_customers", sortColumn: "customer_name", searchColumns: ["customer_id", "customer_name", "email", "contact_name"] },
  { table: "lims_groups", sortColumn: "name", searchColumns: ["group_id", "name", "description"] },
  { table: "lims_inspection_plans", sortColumn: "name", searchColumns: ["inspection_id", "name", "description"] },
  { table: "lims_instrument_parts", sortColumn: "part_name", searchColumns: ["part_id", "part_name", "serial_number", "model_number", "manufacturer"] },
  { table: "lims_instruments", sortColumn: "name", searchColumns: ["instrument_id", "name", "serial_number", "model_number", "manufacturer"] },
  { table: "lims_users", sortColumn: "user_name", searchColumns: ["user_id", "user_name", "description"] },
  { table: "lims_locations", sortColumn: "location_name", searchColumns: ["location_id", "location_name", "description"] },
  { table: "lims_lots", sortColumn: "created_at", searchColumns: ["lot_id", "lot_name", "description"] },
  { table: "lims_parameters", sortColumn: "parameter_name", searchColumns: ["parameter_id", "parameter_name", "unit"] },
  { table: "lims_phrases", sortColumn: "name", searchColumns: ["phrase", "name", "description"] },
  { table: "lims_projects", sortColumn: "name", searchColumns: ["project_id", "name", "code", "details"] },
  { table: "lims_results", sortColumn: "created_at", searchColumns: ["result_id", "component_name", "value"] },
  { table: "lims_roles", sortColumn: "name", searchColumns: ["role_id", "name", "description"] },
  { table: "lims_samples", sortColumn: "created_at", searchColumns: ["sample_id", "id_text", "sample_name", "lot_number", "serial_number"] },
  { table: "lims_schedulers", sortColumn: "name", searchColumns: ["scheduler_id", "name", "description"] },
  { table: "lims_specifications", sortColumn: "name", searchColumns: ["spec_id", "name", "description"] },
  { table: "lims_stock_batches", sortColumn: "stock_batch_id", searchColumns: ["stock_batch_id", "supplier_batch_number", "sap_batch_id", "internal_batch_id"] },
  { table: "lims_stocks", sortColumn: "stock_name", searchColumns: ["stock_id", "stock_name", "description"] },
  { table: "lims_studies", sortColumn: "name", searchColumns: ["study_id", "name", "study_code", "details"] },
  { table: "lims_suppliers", sortColumn: "supplier_name", searchColumns: ["supplier_id", "supplier_name", "email", "contact_name"] },
  { table: "lims_test_groups", sortColumn: "name", searchColumns: ["test_group_id", "name", "description"] },
  { table: "lims_tests", sortColumn: "created_at", searchColumns: ["test_id", "test_name", "description"] }
];

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  for (const { table, sortColumn, searchColumns } of SPECS) {
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS ${table}_active_sort_idx ON ${table} (is_deleted, ${sortColumn})`
    );

    for (const column of new Set(searchColumns)) {
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS ${table}_${column}_trgm_idx ON ${table} USING GIN (${column} gin_trgm_ops)`
      );
    }
  }
};
