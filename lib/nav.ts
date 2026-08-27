/**
 * Picks the most specific nav href for a pathname, so `/trades/new` highlights
 * "New Trade" rather than also lighting up "Trade Log".
 */
export function activeHref(pathname: string, hrefs: readonly string[]) {
  return hrefs
    .filter(
      (href) =>
        pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    )
    .sort((a, b) => b.length - a.length)[0];
}
