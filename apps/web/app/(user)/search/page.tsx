import { SearchView } from "@/components/search/SearchView";

export default async function SearchPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const raw = sp?.q;
  const initialQ = typeof raw === "string" ? raw : "";
  return <SearchView initialQ={initialQ} />;
}
