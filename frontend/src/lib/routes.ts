export function categoryHref(parentSlug: string, childSlug: string): string {
  return `/category/${encodeURIComponent(parentSlug)}/${encodeURIComponent(childSlug)}`;
}
