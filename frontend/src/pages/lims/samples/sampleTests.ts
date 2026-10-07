import type {
  ExpandedTemplate,
  ExpandedTestSources
} from "@/pages/lims/test-groups/LimsTestGroup.api";
import type { LimsSampleTest } from "./LimsSample.types";

/** A Test Template picked on a sample form, not yet saved as a Test. */
export interface PendingTemplate {
  id: string;
  name: string;
  /** Unknown when the row came back from a save (only the template's name is returned). */
  componentCount?: number;
  /** The Test Group it was picked through; unset for a template picked on its own. */
  sourceGroupId?: string;
  sourceGroupName?: string;
}

/** Template ids a sample already carries — saved (not cancelled) or picked on the form. */
export const takenTemplateIds = (
  existing: LimsSampleTest[],
  pending: PendingTemplate[]
) =>
  new Set([
    ...existing
      .filter((test) => test.status !== "Cancelled" && test.analysisId)
      .map((test) => String(test.analysisId)),
    ...pending.map((tpl) => tpl.id)
  ]);

/** Appends `templates` to `pending`, skipping ones the sample already has and non-Approved ones.
 * A template reached through two groups stays under the first. */
export const addTemplates = (
  existing: LimsSampleTest[],
  pending: PendingTemplate[],
  templates: ExpandedTemplate[],
  group?: { id: string; name: string }
) => {
  const taken = takenTemplateIds(existing, pending);
  const added: PendingTemplate[] = [];
  const skipped: string[] = [];
  let duplicates = 0;
  for (const tpl of templates) {
    if (!tpl.approved) {
      skipped.push(tpl.name);
      continue;
    }
    if (taken.has(tpl.id)) {
      duplicates += 1;
      continue;
    }
    taken.add(tpl.id);
    added.push({
      id: tpl.id,
      name: tpl.name,
      componentCount: tpl.componentCount,
      sourceGroupId: group?.id,
      sourceGroupName: group?.name
    });
  }
  return { pending: [...pending, ...added], added, skipped, duplicates };
};

/** Applies an `expand` result (groups first, then individual templates) to one sample. */
export const applyExpansion = (
  existing: LimsSampleTest[],
  pending: PendingTemplate[],
  expansion: ExpandedTestSources
) => {
  let next = pending;
  const skipped = new Set<string>();
  let added = 0;
  let duplicates = 0;
  const run = (
    templates: ExpandedTemplate[],
    group?: { id: string; name: string }
  ) => {
    const result = addTemplates(existing, next, templates, group);
    next = result.pending;
    added += result.added.length;
    duplicates += result.duplicates;
    result.skipped.forEach((name) => skipped.add(name));
  };
  expansion.groups.forEach((group) => run(group.templates, group));
  run(expansion.templates);
  return { pending: next, added, duplicates, skipped: [...skipped] };
};
