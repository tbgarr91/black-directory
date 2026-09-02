import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { BusinessListing } from "@/components/BusinessListing";
import { supabase, type BusinessSearchResult, type Category } from "@/lib/supabase";

async function getTopCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("category_id, parent_id, name, slug, description")
    .is("parent_id", null)
    .order("name");
  return data ?? [];
}

async function getFeaturedBusinesses(): Promise<BusinessSearchResult[]> {
  const { data } = await supabase
    .from("business_search_view")
    .select("*")
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(5);
  return data ?? [];
}

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getTopCategories(),
    getFeaturedBusinesses(),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14">
        <section>
          <h1 className="font-display max-w-2xl text-4xl leading-tight text-ink sm:text-5xl">
            Find a Black-owned business — or a Black-owned alternative to one you already use.
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            Search by what you need, or by the brand you'd normally reach for.
            Every listing shows whether ownership is verified and how the
            community actually rates it.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-lg text-ink">Browse by category</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.category_id}
                  href={`/search?category=${c.slug}`}
                  className="rounded-sm border border-rule px-3.5 py-1.5 text-sm text-ink-soft hover:border-indigo hover:text-indigo transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-lg text-ink">Highly rated right now</h2>
            <div className="mt-2">
              {featured.map((b) => (
                <BusinessListing key={b.business_id} business={b} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
