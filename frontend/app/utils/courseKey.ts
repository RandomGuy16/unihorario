export function generateCourseKey(
  year: string | number,
  id: string,
  name: string,
  career: string
): string {
  return `${year}-${id}-${name}-${career}`
}
