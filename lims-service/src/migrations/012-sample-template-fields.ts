import { QueryInterface } from "sequelize";

const COLUMNS: [string, string][] = [
  ["sampleType", "sample_type_id"],
  ["project", "project_id"],
  ["specification", "specification_id"],
  ["location", "location_id"],
  ["group", "group_id"],
  ["lotNumber", "lot_number"],
  ["serialNumber", "serial_number"],
  ["loginDate", "login_date"],
  ["loginBy", "login_by"],
  ["sampleStartDate", "sample_start_date"],
  ["sampleStartBy", "sample_start_by"],
  ["description", "description"],
  ["comments", "comments"]
];

/** Templates choose their own fields and names; samples keep a copy of that layout, so editing
 * a template never changes them. Existing templates get a row for each field they already use. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.lims_sample_template_fields (
      id uuid PRIMARY KEY,
      sample_template_id uuid NOT NULL
        REFERENCES public.lims_sample_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
      field_key character varying(50) NOT NULL,
      display_name character varying(100),
      sort_order integer,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      UNIQUE (sample_template_id, field_key)
    );

    ALTER TABLE public.lims_sample_templates
      ADD COLUMN IF NOT EXISTS sample_name character varying(200),
      ADD COLUMN IF NOT EXISTS id_text character varying(255);

    ALTER TABLE public.lims_samples
      ADD COLUMN IF NOT EXISTS sample_template_id uuid
        REFERENCES public.lims_sample_templates(id) ON UPDATE CASCADE ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS field_layout jsonb;
  `);

  const addRows = (key: string, order: number, where = "true") =>
    db.query(`
      INSERT INTO lims_sample_template_fields (id, sample_template_id, field_key, sort_order)
      SELECT gen_random_uuid(), t.id, '${key}', ${order}
        FROM lims_sample_templates t
       WHERE ${where}
      ON CONFLICT (sample_template_id, field_key) DO NOTHING
    `);
  await addRows("sampleId", 0);
  await addRows("sampleName", 1);
  await addRows("idText", 2);
  for (const [index, [key, column]] of COLUMNS.entries())
    await addRows(
      key,
      index + 3,
      `t.${column} IS NOT NULL AND t.${column}::text <> ''`
    );
};
