import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { BusinessListing } from "@/components/BusinessListing";
import { NearMeSearch } from "@/components/NearMeSearch";
import { supabase, type BusinessSearchResult, type ReferenceBrand } from "@/lib/supabase";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

async function findMatchingBrand(query: string): Promise<ReferenceBrand | null> {
  const { data } = await supabase
    .from("reference_brands")
    .select("reference_brand_id, name, category_id")
    .ilike("name", `%${query}%`)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function getAlternativesFor(referenceBrandId: string): Promise<BusinessSearchResult[]> {
  const { data } = await supabase
    .from("business_alternatives")
    .select("business_id")
    .eq("reference_brand_id", referenceBrandId);

  const ids = (data ?? []).map((row) => row.business_id);
  if (ids.length === 0) return [];

  const { data: businesses } = await supabase
    .from("business_search_view")
    .select("*")
    .in("business_id", ids);

  return businesses ?? [];
}

async function searchBusinesses(query: string): Promise<BusinessSearchResult[]> {
  const { data } = await supabase
    .from("business_search_view")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(30);
  return data ?? [];
}

async function searchByCategory(categorySlug: string): Promise<BusinessSearchResult[]> {
  const { data: category } = await supabase
    .from("categories")
    .select("category_id, name")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return [];

  const { data: links } = await supabase
    .from("business_categories")
    .select("business_id")
    .eq("category_id", category.category_id);

  const ids = (links ?? []).map((row) => row.business_id);
  if (ids.length === 0) return [];

  const { data: businesses } = await supabase
    .from("business_search_view")
    .select("*")
    .in("business_id", ids);

  return businesses ?? [];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, category } = await searchParams;

  let matchedBrand: ReferenceBrand | null = null;
  let alternatives: BusinessSearchResult[] = [];
  let generalResults: BusinessSearchResult[] = [];
  let categoryName: string | null = null;

  if (category) {
    generalResults = await searchByCategory(category);
    const { data: catRow } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", category)
      .maybeSingle();
    categoryName = catRow?.name ?? category;
  } else if (q) {
    matchedBrand = await findMatchingBrand(q);
    if (matchedBrand) {
      alternatives = await getAlternativesFor(matchedBrand.reference_brand_id);
    }
    generalResults = await searchBusinesses(q);
    // Don't double-list businesses already shown as direct alternatives
    const altIds = new Set(alternatives.map((b) => b.business_id));
    generalResults = generalResults.filter((b) => !altIds.has(b.business_id));
  }

  const hasQuery = Boolean(q || category);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
        <SearchBar initialQuery={q ?? ""} />

        {!hasQuery && (
          <>
            <p className="mt-8 text-ink-soft">
              Search for a category (like "coffee" or "skincare") or a brand
              name (like "Sephora") to find a Black-owned alternative.
            </p>
            <div className="mt-6">
              <NearMeSearch />
            </div>
          </>
        )}

        {categoryName && (
          <div className="mt-10">
            <h1 className="font-display text-2xl text-ink">{categoryName}</h1>
            {generalResults.length === 0 ? (
              <p className="mt-4 text-ink-soft">
                No listings in this category yet. Know a business that
                belongs here? <a href="/submit" className="text-indigo underline">List it</a>.
              </p>
            ) : (
              <div className="mt-4">
                {generalResults.map((b) => (
                  <BusinessListing key={b.business_id} business={b} />
                ))}
              </div>
            )}
          </div>
        )}

        {q && matchedBrand && (
          <div className="mt-10">
            <h1 className="font-display text-2xl text-ink">
              Black-owned alternatives to {matchedBrand.name}
            </h1>
            {alternatives.length === 0 ? (
              <p className="mt-4 text-ink-soft">
                No alternatives mapped to {matchedBrand.name} yet. Know one?{" "}
                <a href="/submit" className="text-indigo underline">List it</a>.
              </p>
            ) : (
              <div className="mt-4">
                {alternatives.map((b) => (
                  <BusinessListing key={b.business_id} business={b} />
                ))}
              </div>
            )}
          </div>
        )}

        {q && generalResults.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-lg text-ink">
              {matchedBrand ? "Other matching results" : `Results for "${q}"`}
            </h2>
            <div className="mt-4">
              {generalResults.map((b) => (
                <BusinessListing key={b.business_id} business={b} />
              ))}
            </div>
          </div>
        )}

        {q && !matchedBrand && generalResults.length === 0 && (
          <p className="mt-10 text-ink-soft">
            No results for "{q}" yet. Know a Black-owned business that fits?{" "}
            <a href="/submit" className="text-indigo underline">List it</a>.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
