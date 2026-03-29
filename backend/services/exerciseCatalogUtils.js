export function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeTag(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

export function normalizeTagArray(value) {
  return normalizeArray(value)
    .map(normalizeTag)
    .filter(Boolean);
}

export function hasTagIntersection(left = [], right = []) {
  const rightSet = new Set(normalizeTagArray(right));

  return normalizeTagArray(left).some((item) => rightSet.has(item));
}

export function normalizeEquipment(value) {
  const normalizedValue = normalizeTag(value);

  if (!normalizedValue || normalizedValue === "bodyweight") {
    return "bodyweight";
  }

  return normalizedValue;
}
