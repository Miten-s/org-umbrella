import { QueryInterface, QueryTypes } from "sequelize";
import { ENTITY_TABLES } from "../configs/entity-template-catalog";

interface OldCriteria {
  field?: string;
  value?: string;
  label?: string;
}

const parse = (raw: string | null): OldCriteria | null => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Reusable Entity Templates replace a component's single Where/Is. Each distinct old pair
 * becomes a template (no pair = every record), and results keep the picked record's name. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.lims_entity_templates (
      id uuid PRIMARY KEY,
      entity_template_id character varying(50) NOT NULL UNIQUE,
      name character varying(200) NOT NULL,
      entity character varying(50) NOT NULL,
      query jsonb NOT NULL,
      description text,
      group_id uuid REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL,
      is_deleted boolean NOT NULL DEFAULT false,
      deleted_at timestamp with time zone,
      deleted_by character varying(100),
      modified_by character varying(100),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );

    ALTER TABLE public.lims_analysis_components
      ADD COLUMN IF NOT EXISTS entity_template_id uuid
        REFERENCES public.lims_entity_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;

    ALTER TABLE public.lims_test_windows
      ADD COLUMN IF NOT EXISTS component_entity character varying(50),
      ADD COLUMN IF NOT EXISTS component_entity_template_id uuid
        REFERENCES public.lims_entity_templates(id) ON UPDATE CASCADE ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS value_label character varying(300);
  `);

  const components = await db.query<{
    id: string;
    entity: string;
    entity_criteria: string | null;
  }>(
    `SELECT id, entity, entity_criteria FROM lims_analysis_components
      WHERE type = 'ENTITY' AND entity IS NOT NULL AND entity_template_id IS NULL`,
    { type: QueryTypes.SELECT }
  );

  const created = new Map<string, string>();
  for (const component of components) {
    const table = ENTITY_TABLES[component.entity];
    if (!table) continue;
    const criteria = parse(component.entity_criteria);
    const field = criteria?.field ? table.fields[criteria.field] : undefined;
    const rule = field && criteria?.value ? criteria : null;
    const key = `${component.entity}|${rule?.field ?? ""}|${rule?.value ?? ""}`;

    if (!created.has(key)) {
      const number = created.size + 1;
      const [row] = await db.query<{ id: string }>(
        `INSERT INTO lims_entity_templates (id, entity_template_id, name, entity, query)
         VALUES (gen_random_uuid(), :businessId, :name, :entity, CAST(:query AS jsonb))
         ON CONFLICT (entity_template_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            businessId: `ENT-M-${String(number).padStart(6, "0")}`,
            name: rule
              ? `${table.label}: ${field!.label} is ${rule.label ?? rule.value}`
              : `All ${table.label} records`,
            entity: component.entity,
            query: JSON.stringify({
              combinator: "and",
              rules: rule
                ? [
                    {
                      field: rule.field,
                      operator: "=",
                      value: rule.value,
                      label: rule.label
                    }
                  ]
                : []
            })
          }
        }
      );
      created.set(key, row.id);
    }
    await db.query(
      `UPDATE lims_analysis_components SET entity_template_id = :templateId WHERE id = :id`,
      { replacements: { templateId: created.get(key), id: component.id } }
    );
  }

  await db.query(`
    UPDATE public.lims_test_windows w
       SET component_entity = c.entity,
           component_entity_template_id = c.entity_template_id
      FROM public.lims_tests t
      JOIN public.lims_analysis_components c ON c.analysis_id = t.analysis_id
     WHERE w.test_id = t.id
       AND c.component_id = w.component_id
       AND c.type = 'ENTITY'
       AND w.component_entity IS NULL;
  `);
};
