import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaptionsList } from "@/components/admin/CaptionsList";
import type { HumorFlavor } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function FlavorCaptionsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1");
  const pageSize = 20;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect("/");
  }

  // Fetch the specific flavor
  const { data: flavor, error: flavorError } = await supabase
    .from("humor_flavors")
    .select("*")
    .eq("id", id)
    .single();

  if (flavorError || !flavor) {
    notFound();
  }

  // Fetch captions for this flavor with pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: captions, count } = await supabase
    .from("captions")
    .select(
      `
      *,
      images:image_id (
        id,
        url
      )
    `,
      { count: "exact" }
    )
    .eq("humor_flavor_id", id)
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  return (
    <CaptionsList
      profile={profile}
      flavor={flavor as HumorFlavor}
      captions={captions || []}
      totalCount={count || 0}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
