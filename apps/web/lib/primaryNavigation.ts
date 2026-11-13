/** One shared, predictable three-destination navigation model. */
export type PrimaryDestination = "recipes" | "pantry" | "plan";

export const PRIMARY_DESTINATIONS = [
  { id: "recipes" as const, href: "/search", label: "Жор хайх" },
  { id: "pantry" as const, href: "/pantry", label: "Миний орц" },
  { id: "plan" as const, href: "/plan", label: "Төлөвлөх" },
];

export function activePrimaryDestination(pathname: string): PrimaryDestination | null {
  if (pathname === "/pantry" || pathname.startsWith("/suggest")) return "pantry";
  if (pathname === "/plan") return "plan";
  if (pathname === "/" || pathname === "/search" || pathname === "/discover" ||
      pathname === "/cuisines" || pathname.startsWith("/recipe/")) return "recipes";
  return null;
}
