import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HumorFlavorsClient } from "./HumorFlavorsClient";
import type {
  HumorFlavor,
  LlmModel,
  LlmInputType,
  LlmOutputType,
  HumorFlavorStepType,
} from "@/lib/types";

export default async function AdminDashboard() {
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

  // Fetch all data in parallel
  const [
    { data: humorFlavors },
    { data: llmModels },
    { data: llmInputTypes },
    { data: llmOutputTypes },
    { data: stepTypes },
  ] = await Promise.all([
    supabase.from("humor_flavors").select("*").order("created_datetime_utc", { ascending: false }),
    supabase.from("llm_models").select("*").order("name"),
    supabase.from("llm_input_types").select("*").order("slug"),
    supabase.from("llm_output_types").select("*").order("slug"),
    supabase.from("humor_flavor_step_types").select("*").order("slug"),
  ]);

  return (
    <HumorFlavorsClient
      profile={profile}
      initialFlavors={(humorFlavors as HumorFlavor[]) || []}
      llmModels={(llmModels as LlmModel[]) || []}
      llmInputTypes={(llmInputTypes as LlmInputType[]) || []}
      llmOutputTypes={(llmOutputTypes as LlmOutputType[]) || []}
      stepTypes={(stepTypes as HumorFlavorStepType[]) || []}
    />
  );
}
