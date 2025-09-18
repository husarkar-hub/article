export function prismaErrorTargetsInclude(
  target: unknown,
  field: string
): boolean {
  if (Array.isArray(target)) {
    return target.some((value) => value === field);
  }

  return target === field;
}
