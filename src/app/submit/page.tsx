import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubmitForm } from "@/components/SubmitForm";
import { supabase, type Category } from "@/lib/supabase";

async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("category_id, parent_id, name, slug, description")
    .order("name");
  return data ?? [];
}

export default async function SubmitPage() {
  const categories = await getCategories();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 className="font-display text-3xl text-ink">List a business</h1>
        <p className="mt-3 max-w-lg text-ink-soft">
          Know a Black-owned business — maybe you just met the owner at an
          event? Add it here. It'll show as pending until we verify
          ownership, then it goes live.
        </p>
        <div className="mt-8">
          <SubmitForm categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  );
}
