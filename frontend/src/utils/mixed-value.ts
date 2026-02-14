export type MixedOption = { text: string; value: string };
export type IdOrName = { _id?: string; name?: string };

export const normalizeMixedId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id ?? value?.id ?? value?.value ?? "";
};

export const normalizeMixedIdArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeMixedId(item)).filter(Boolean);
};

export const mapToIdOrNameArray = (
  values: string[] | undefined,
  options: MixedOption[]
): IdOrName[] => {
  if (!values?.length) return [];
  const optionMap = new Map(options.map((opt) => [opt.value, opt.text]));
  return values.map((val) => {
    const text = optionMap.get(val);
    if (text && text !== val) return { _id: val, name: text };
    return { name: text ?? val };
  });
};

export const appendUniqueString = (
  current: string[] | undefined,
  next: string
) => {
  return current?.includes(next) ? current : [...(current || []), next];
};
