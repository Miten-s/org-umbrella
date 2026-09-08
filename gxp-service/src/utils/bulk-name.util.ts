import { Model, ModelStatic, Op, Transaction } from "sequelize";

const stripCopySuffix = (name: string) => {
  const match = name.match(/^(.*?)(?:-\(\d+\))?$/);
  return (match?.[1] || name).trim() || name.trim();
};

/**
 * Finds the next non-colliding "<base>-(<n>)" name for a bulk-copy, scanning
 * existing rows via a case-insensitive regex. Generalizes the -(<n>) suffix
 * logic duplicated across suppliers/environments/applications/assignment-groups/
 * application-modules' bulkDuplicate*, plus workflows' length-capped variant
 * (pass maxLength to get that truncate-and-suffix behavior).
 */
export const resolveUniqueName = async (
  model: ModelStatic<Model>,
  nameField: string,
  rawBaseName: string,
  maxLength?: number,
  transaction?: Transaction
): Promise<string> => {
  const baseName = stripCopySuffix(rawBaseName) || "Untitled";
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexStr = `^${escaped}(?:-\\((\\d+)\\))?$`;

  // Project just the name column — a bulk-copy loop doesn't need whole rows to compute the suffix.
  const similar = await model.findAll({
    attributes: [nameField],
    where: { [nameField]: { [Op.iRegexp]: regexStr } },
    transaction
  });

  // No collision at all — the reviewed name is already unique, so save it
  // as typed instead of suffixing a name nobody is fighting over.
  if (similar.length === 0) return baseName;

  let maxIndex = 0;
  for (const row of similar) {
    const value = String((row as any).get(nameField) ?? "");
    const match = value.match(new RegExp(regexStr, "i"));
    if (match?.[1]) maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
  }

  const suffix = `-(${maxIndex + 1})`;
  if (!maxLength) return `${baseName}${suffix}`;

  const safeBase =
    baseName.slice(0, Math.max(1, maxLength - suffix.length)).trim() ||
    baseName;
  return `${safeBase}${suffix}`;
};
