import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlavorDetailClient } from "./FlavorDetailClient";
import type {
  HumorFlavor,
  HumorFlavorStep,
  LlmModel,
  LlmInputType,
  LlmOutputType,
  HumorFlavorStepType,
  StudyImageSet,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FlavorDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch steps for this flavor
  const { data: steps } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", id)
    .order("order_by", { ascending: true });

  // Fetch reference data
  const [
    { data: llmModels },
    { data: llmInputTypes },
    { data: llmOutputTypes },
    { data: stepTypes },
    { data: studyImageSetsData },
  ] = await Promise.all([
    supabase.from("llm_models").select("*").order("name"),
    supabase.from("llm_input_types").select("*").order("slug"),
    supabase.from("llm_output_types").select("*").order("slug"),
    supabase.from("humor_flavor_step_types").select("*").order("slug"),
    supabase
      .from("study_image_sets")
      .select(`
        id,
        slug,
        description,
        study_image_set_image_mappings (
          image_id,
          images (
            id,
            url,
            image_description
          )
        )
      `)
      .order("slug"),
  ]);

  const studyImageSets: StudyImageSet[] = (studyImageSetsData || []).map(
    (set) => ({
      id: set.id,
      slug: set.slug,
      description: set.description,
      images: (set.study_image_set_image_mappings || []).flatMap((mapping) =>
        Array.isArray(mapping.images)
          ? mapping.images.map((image) => ({
              id: image.id,
              url: image.url,
              image_description: image.image_description,
            }))
          : []
      ),
    })
  );

  return (
    <FlavorDetailClient
      profile={profile}
      flavor={flavor as HumorFlavor}
      initialSteps={(steps as HumorFlavorStep[]) || []}
      llmModels={(llmModels as LlmModel[]) || []}
      llmInputTypes={(llmInputTypes as LlmInputType[]) || []}
      llmOutputTypes={(llmOutputTypes as LlmOutputType[]) || []}
      stepTypes={(stepTypes as HumorFlavorStepType[]) || []}
      studyImageSets={studyImageSets}
    />
  );
}
