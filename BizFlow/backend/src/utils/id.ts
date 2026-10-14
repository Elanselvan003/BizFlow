// Safe unique ID generator

export function generateId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${prefix}_${random}`;
}
