export function isMongoObjectId(s: string): boolean {
  return /^[a-f\d]{24}$/i.test(s);
}
