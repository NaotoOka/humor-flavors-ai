"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import type {
  HumorFlavor,
  LlmModel,
  LlmInputType,
  LlmOutputType,
  HumorFlavorStepType,
} from "@/lib/types";

interface HumorFlavorsListProps {
  profile: {
    first_name: string | null;
    email: string | null;
    is_superadmin: boolean;
    is_matrix_admin: boolean;
  };
  initialFlavors: HumorFlavor[];
  llmModels: LlmModel[];
  llmInputTypes: LlmInputType[];
  llmOutputTypes: LlmOutputType[];
  stepTypes: HumorFlavorStepType[];
  flavorFirstStepModelMap: Record<number, number | null>;
}

interface StepFormData {
  description: string;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
  llm_temperature: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
}

const WIZARD_STEPS = [
  { id: 1, name: "Basics", description: "Name & description" },
  { id: 2, name: "Steps", description: "Prompt chain" },
  { id: 3, name: "Review", description: "Confirm & create" },
];

// Expandable Textarea Component
interface ExpandableTextareaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function ExpandableTextarea({ label, placeholder, value, onChange }: ExpandableTextareaProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Expand"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y min-h-[80px]"
        />
      </div>

      {/* Expanded Modal */}
      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={label}
        size="full"
      >
        <div className="space-y-4">
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-[70vh] font-mono"
            autoFocus
          />
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsExpanded(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function HumorFlavorsList({
  profile,
  initialFlavors,
  llmModels,
  llmInputTypes,
  llmOutputTypes,
  stepTypes,
  flavorFirstStepModelMap,
}: HumorFlavorsListProps) {
  const router = useRouter();
  const [flavors, setFlavors] = useState<HumorFlavor[]>(initialFlavors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelFilter, setSelectedModelFilter] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<HumorFlavor | null>(null);
  const [formData, setFormData] = useState({ slug: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSteps, setWizardSteps] = useState<StepFormData[]>([]);
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);

  const modelOptions = llmModels.map((m) => ({ value: m.id, label: m.name }));
  const inputTypeOptions = llmInputTypes.map((t) => ({
    value: t.id,
    label: t.description,
  }));
  const outputTypeOptions = llmOutputTypes.map((t) => ({
    value: t.id,
    label: t.description,
  }));
  const stepTypeOptions = stepTypes.map((t) => ({
    value: t.id,
    label: t.description,
  }));

  const getDefaultStepData = (): StepFormData => ({
    description: "",
    llm_model_id: llmModels[0]?.id || 0,
    llm_input_type_id: llmInputTypes[0]?.id || 0,
    llm_output_type_id: llmOutputTypes[0]?.id || 0,
    humor_flavor_step_type_id: stepTypes[0]?.id || 0,
    llm_temperature: "0.7",
    llm_system_prompt: "",
    llm_user_prompt: "",
  });

  const getFlavorFirstModelName = (flavorId: number) => {
    const modelId = flavorFirstStepModelMap[flavorId];
    if (!modelId) return null;
    return llmModels.find((m) => m.id === modelId)?.name || null;
  };

  const filteredFlavors = flavors.filter((flavor) => {
    const matchesSearch =
      flavor.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flavor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFlavorFirstModelName(flavor.id)?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModel =
      selectedModelFilter === null ||
      flavorFirstStepModelMap[flavor.id] === selectedModelFilter;

    return matchesSearch && matchesModel;
  });

  const resetWizard = () => {
    setWizardStep(1);
    setFormData({ slug: "", description: "" });
    setWizardSteps([]);
    setError(null);
  };

  const handleCreateWithSteps = async () => {
    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create the flavor first
      const { data: newFlavor, error: insertError } = await supabase
        .from("humor_flavors")
        .insert({
          slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: formData.description.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create steps if any
      if (wizardSteps.length > 0) {
        const stepsToInsert = wizardSteps.map((step, index) => ({
          humor_flavor_id: newFlavor.id,
          order_by: index + 1,
          llm_model_id: step.llm_model_id,
          llm_input_type_id: step.llm_input_type_id,
          llm_output_type_id: step.llm_output_type_id,
          humor_flavor_step_type_id: step.humor_flavor_step_type_id,
          llm_temperature: step.llm_temperature ? parseFloat(step.llm_temperature) : null,
          llm_system_prompt: step.llm_system_prompt.trim() || null,
          llm_user_prompt: step.llm_user_prompt.trim() || null,
          description: step.description.trim() || null,
        }));

        const { error: stepsError } = await supabase
          .from("humor_flavor_steps")
          .insert(stepsToInsert);

        if (stepsError) throw stepsError;
      }

      setFlavors([newFlavor as HumorFlavor, ...flavors]);
      setIsCreateModalOpen(false);
      resetWizard();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flavor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlavor || !formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("humor_flavors")
        .update({
          slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: formData.description.trim() || null,
          modified_datetime_utc: new Date().toISOString(),
        })
        .eq("id", selectedFlavor.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setFlavors(
        flavors.map((f) => (f.id === selectedFlavor.id ? (data as HumorFlavor) : f))
      );
      setIsEditModalOpen(false);
      setSelectedFlavor(null);
      setFormData({ slug: "", description: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flavor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlavor) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("humor_flavors")
        .delete()
        .eq("id", selectedFlavor.id);

      if (deleteError) throw deleteError;

      setFlavors(flavors.filter((f) => f.id !== selectedFlavor.id));
      setIsDeleteDialogOpen(false);
      setSelectedFlavor(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flavor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (flavor: HumorFlavor) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create new flavor with "copy-" prefix
      const newSlug = `copy-${flavor.slug}`;
      const { data: newFlavor, error: insertError } = await supabase
        .from("humor_flavors")
        .insert({
          slug: newSlug,
          description: flavor.description,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Fetch and duplicate all steps from the original flavor
      const { data: originalSteps, error: stepsError } = await supabase
        .from("humor_flavor_steps")
        .select("*")
        .eq("humor_flavor_id", flavor.id)
        .order("order_by");

      if (stepsError) throw stepsError;

      if (originalSteps && originalSteps.length > 0) {
        const stepsToInsert = originalSteps.map((step) => ({
          humor_flavor_id: newFlavor.id,
          order_by: step.order_by,
          llm_model_id: step.llm_model_id,
          llm_input_type_id: step.llm_input_type_id,
          llm_output_type_id: step.llm_output_type_id,
          humor_flavor_step_type_id: step.humor_flavor_step_type_id,
          llm_temperature: step.llm_temperature,
          llm_system_prompt: step.llm_system_prompt,
          llm_user_prompt: step.llm_user_prompt,
          description: step.description,
        }));

        const { error: insertStepsError } = await supabase
          .from("humor_flavor_steps")
          .insert(stepsToInsert);

        if (insertStepsError) throw insertStepsError;
      }

      setFlavors([newFlavor as HumorFlavor, ...flavors]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate flavor");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (flavor: HumorFlavor) => {
    setSelectedFlavor(flavor);
    setFormData({
      slug: flavor.slug,
      description: flavor.description || "",
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (flavor: HumorFlavor) => {
    setSelectedFlavor(flavor);
    setIsDeleteDialogOpen(true);
  };

  const addWizardStep = () => {
    setWizardSteps([...wizardSteps, getDefaultStepData()]);
  };

  const removeWizardStep = (index: number) => {
    setWizardSteps(wizardSteps.filter((_, i) => i !== index));
  };

  const updateWizardStep = (index: number, data: Partial<StepFormData>) => {
    setWizardSteps(
      wizardSteps.map((step, i) => (i === index ? { ...step, ...data } : step))
    );
  };

  const getModelName = (id: number) => llmModels.find((m) => m.id === id)?.name || "Unknown";
  const getStepTypeName = (id: number) => stepTypes.find((t) => t.id === id)?.description || "Unknown";

  const canProceedToNext = () => {
    if (wizardStep === 1) {
      return formData.slug.trim().length > 0;
    }
    return true;
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <AdminHeader profile={profile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Humor Flavors
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage AI prompt chains for caption generation
            </p>
          </div>
          <Button
            onClick={() => {
              resetWizard();
              setIsCreateModalOpen(true);
            }}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Flavor
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by slug, description, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Select
            options={[
              { value: 0, label: "All Models" },
              ...llmModels.map((m) => ({ value: m.id, label: m.name })),
            ]}
            value={selectedModelFilter ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSelectedModelFilter(val === 0 ? null : val);
            }}
            className="max-w-[200px]"
          />
        </div>

        {filteredFlavors.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.27a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No Humor Flavors Found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "No flavors match your search."
                : "Get started by creating your first humor flavor."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create First Flavor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFlavors.map((flavor) => (
              <div
                key={flavor.id}
                className="glass-card group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-foreground truncate">
                      {flavor.slug}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                      ID: {flavor.id}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDuplicate(flavor)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Duplicate"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEditModal(flavor)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteDialog(flavor)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                  {flavor.description || "No description provided"}
                </p>

                {getFlavorFirstModelName(flavor.id) && (
                  <div className="mb-3">
                    <span className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-bold uppercase">
                      {getFlavorFirstModelName(flavor.id)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/admin/flavors/${flavor.id}`}
                    className="inline-flex items-center text-xs font-black uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
                  >
                    Manage
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Flavor Wizard Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetWizard();
        }}
        title="Create New Flavor"
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {WIZARD_STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      wizardStep > step.id
                        ? "bg-primary text-white"
                        : wizardStep === step.id
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-card-bg border border-card-border text-muted-foreground"
                    }`}
                  >
                    {wizardStep > step.id ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {step.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/70">{step.description}</span>
                </div>
              ))}
            </div>
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-card-border -z-10 mx-16">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((wizardStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <Input
                  label="Slug"
                  placeholder="e.g., sarcastic-wit"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <Textarea
                  label="Description"
                  placeholder="Describe what makes this humor flavor unique..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Add prompt chain steps for this flavor. You can also add steps later.
                  </p>
                  <Button size="sm" onClick={addWizardStep}>
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Step
                  </Button>
                </div>

                {wizardSteps.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center">
                    <svg className="mx-auto h-10 w-10 text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm text-muted-foreground">
                      No steps added yet. Click &quot;Add Step&quot; to configure your prompt chain.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {wizardSteps.map((step, index) => (
                      <div key={index} className="rounded-xl border border-card-border bg-card-bg/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {step.description || `Step ${index + 1}`}
                            </span>
                          </div>
                          <button
                            onClick={() => removeWizardStep(index)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid gap-3">
                          <Input
                            label="Description"
                            placeholder="e.g., Describe the image"
                            value={step.description}
                            onChange={(e) => updateWizardStep(index, { description: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Select
                              label="Step Type"
                              options={stepTypeOptions}
                              value={step.humor_flavor_step_type_id}
                              onChange={(e) => updateWizardStep(index, { humor_flavor_step_type_id: parseInt(e.target.value) })}
                            />
                            <Select
                              label="LLM Model"
                              options={modelOptions}
                              value={step.llm_model_id}
                              onChange={(e) => {
                                const newModelId = parseInt(e.target.value);
                                const newModel = llmModels.find((m) => m.id === newModelId);
                                const updates: Partial<StepFormData> = { llm_model_id: newModelId };
                                // Clear temperature if new model doesn't support it
                                if (newModel && !newModel.is_temperature_supported) {
                                  updates.llm_temperature = "";
                                }
                                updateWizardStep(index, updates);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Select
                              label="Input Type"
                              options={inputTypeOptions}
                              value={step.llm_input_type_id}
                              onChange={(e) => updateWizardStep(index, { llm_input_type_id: parseInt(e.target.value) })}
                            />
                            <Select
                              label="Output Type"
                              options={outputTypeOptions}
                              value={step.llm_output_type_id}
                              onChange={(e) => updateWizardStep(index, { llm_output_type_id: parseInt(e.target.value) })}
                            />
                          </div>
                          {(() => {
                            const selectedModel = llmModels.find((m) => m.id === step.llm_model_id);
                            const isTemperatureSupported = selectedModel?.is_temperature_supported ?? true;
                            return isTemperatureSupported ? (
                              <Input
                                label="Temperature"
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                placeholder="0.7"
                                value={step.llm_temperature}
                                onChange={(e) => updateWizardStep(index, { llm_temperature: e.target.value })}
                              />
                            ) : (
                              <div className="p-3 rounded-lg bg-card-bg/50 border border-card-border text-sm text-muted-foreground">
                                Temperature is not supported by {selectedModel?.name || "this model"}
                              </div>
                            );
                          })()}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsVariablesModalOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Prompt Variables
                            </button>
                          </div>
                          <ExpandableTextarea
                            label="System Prompt"
                            placeholder="Enter the system prompt..."
                            value={step.llm_system_prompt}
                            onChange={(value) => updateWizardStep(index, { llm_system_prompt: value })}
                          />
                          <ExpandableTextarea
                            label="User Prompt"
                            placeholder="Enter the user prompt template..."
                            value={step.llm_user_prompt}
                            onChange={(value) => updateWizardStep(index, { llm_user_prompt: value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-card-border bg-card-bg/50 p-5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                    Flavor Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Slug:</span>
                      <span className="text-sm font-bold text-foreground">{formData.slug || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <span className="text-sm text-foreground max-w-[60%] text-right">
                        {formData.description || "No description"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card-bg/50 p-5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                    Prompt Chain Steps ({wizardSteps.length})
                  </h4>
                  {wizardSteps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No steps configured. You can add them later.</p>
                  ) : (
                    <div className="space-y-3">
                      {wizardSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-card-bg/50 border border-card-border">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {step.description || `Step ${index + 1}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {getStepTypeName(step.humor_flavor_step_type_id)} • {getModelName(step.llm_model_id)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-card-border">
            <Button
              variant="secondary"
              onClick={() => {
                if (wizardStep === 1) {
                  setIsCreateModalOpen(false);
                  resetWizard();
                } else {
                  setWizardStep(wizardStep - 1);
                }
              }}
              disabled={isLoading}
            >
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>

            {wizardStep < 3 ? (
              <Button
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={!canProceedToNext()}
              >
                Next
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button onClick={handleCreateWithSteps} loading={isLoading}>
                Create Flavor
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal (simple, no wizard) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Humor Flavor"
      >
        <div className="space-y-4">
          <Input
            label="Slug"
            placeholder="e.g., sarcastic-wit"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
          />
          <Textarea
            label="Description"
            placeholder="Describe what makes this humor flavor unique..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Humor Flavor"
        message={`Are you sure you want to delete "${selectedFlavor?.slug}"? This action cannot be undone and will remove all associated steps.`}
        confirmText="Delete"
        variant="destructive"
        loading={isLoading}
      />

      {/* Prompt Variables Modal */}
      <Modal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
        title="Prompt Variables"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these placeholders to pull in pipeline outputs, image details, and community context.
          </p>

          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
            {[
              '${stepNOutput}',
              '${imageDescription}',
              '${imageAdditionalContext}',
              '${allCommunityContexts}',
              '${tenRandomCommunityContexts}',
              '${fiveRelevantCommunityContexts}',
              '${allTerms}',
              '${tenRandomTerms}',
              '${allCaptionExamples}',
              '${tenRandomCaptionExamples}',
              '${startRandomizeLines}',
              '${endRandomizeLines}',
            ].map((variable) => (
              <div
                key={variable}
                className="flex items-center justify-between p-3 rounded-lg bg-card-bg/50 border border-card-border"
              >
                <code className="text-sm font-mono text-foreground">{variable}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(variable);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-card-border">
            <Button
              variant="secondary"
              onClick={() => setIsVariablesModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
