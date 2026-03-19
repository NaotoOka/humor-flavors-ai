"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TestFlavorModal } from "@/components/admin/TestFlavorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import type {
  HumorFlavor,
  HumorFlavorStep,
  LlmModel,
  LlmInputType,
  LlmOutputType,
  HumorFlavorStepType,
  StudyImageSet,
} from "@/lib/types";

interface FlavorDetailProps {
  profile: {
    first_name: string | null;
    email: string | null;
    is_superadmin: boolean;
    is_matrix_admin: boolean;
  };
  flavor: HumorFlavor;
  initialSteps: HumorFlavorStep[];
  llmModels: LlmModel[];
  llmInputTypes: LlmInputType[];
  llmOutputTypes: LlmOutputType[];
  stepTypes: HumorFlavorStepType[];
  studyImageSets: StudyImageSet[];
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

const defaultStepFormData: StepFormData = {
  description: "",
  llm_model_id: 0,
  llm_input_type_id: 0,
  llm_output_type_id: 0,
  humor_flavor_step_type_id: 0,
  llm_temperature: "0.7",
  llm_system_prompt: "",
  llm_user_prompt: "",
};

export function FlavorDetail({
  profile,
  flavor,
  initialSteps,
  llmModels,
  llmInputTypes,
  llmOutputTypes,
  stepTypes,
  studyImageSets,
}: FlavorDetailProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<HumorFlavorStep[]>(initialSteps);
  const [isCreateStepModalOpen, setIsCreateStepModalOpen] = useState(false);
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false);
  const [isDeleteStepDialogOpen, setIsDeleteStepDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<HumorFlavorStep | null>(null);
  const [stepFormData, setStepFormData] = useState<StepFormData>(defaultStepFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<number | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

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

  const handleCreateStep = async () => {
    if (!stepFormData.llm_model_id || !stepFormData.llm_input_type_id ||
        !stepFormData.llm_output_type_id || !stepFormData.humor_flavor_step_type_id) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const newOrderBy = steps.length > 0 ? Math.max(...steps.map((s) => s.order_by)) + 1 : 1;

      const { data, error: insertError } = await supabase
        .from("humor_flavor_steps")
        .insert({
          humor_flavor_id: flavor.id,
          order_by: newOrderBy,
          llm_model_id: stepFormData.llm_model_id,
          llm_input_type_id: stepFormData.llm_input_type_id,
          llm_output_type_id: stepFormData.llm_output_type_id,
          humor_flavor_step_type_id: stepFormData.humor_flavor_step_type_id,
          llm_temperature: stepFormData.llm_temperature ? parseFloat(stepFormData.llm_temperature) : null,
          llm_system_prompt: stepFormData.llm_system_prompt.trim() || null,
          llm_user_prompt: stepFormData.llm_user_prompt.trim() || null,
          description: stepFormData.description.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSteps([...steps, data as HumorFlavorStep]);
      setIsCreateStepModalOpen(false);
      setStepFormData(defaultStepFormData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStep = async () => {
    if (!selectedStep) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("humor_flavor_steps")
        .update({
          llm_model_id: stepFormData.llm_model_id,
          llm_input_type_id: stepFormData.llm_input_type_id,
          llm_output_type_id: stepFormData.llm_output_type_id,
          humor_flavor_step_type_id: stepFormData.humor_flavor_step_type_id,
          llm_temperature: stepFormData.llm_temperature ? parseFloat(stepFormData.llm_temperature) : null,
          llm_system_prompt: stepFormData.llm_system_prompt.trim() || null,
          llm_user_prompt: stepFormData.llm_user_prompt.trim() || null,
          description: stepFormData.description.trim() || null,
        })
        .eq("id", selectedStep.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSteps(steps.map((s) => (s.id === selectedStep.id ? (data as HumorFlavorStep) : s)));
      setIsEditStepModalOpen(false);
      setSelectedStep(null);
      setStepFormData(defaultStepFormData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStep = async () => {
    if (!selectedStep) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("humor_flavor_steps")
        .delete()
        .eq("id", selectedStep.id);

      if (deleteError) throw deleteError;

      // Reorder remaining steps
      const remainingSteps = steps.filter((s) => s.id !== selectedStep.id);
      const reorderedSteps = remainingSteps.map((s, index) => ({
        ...s,
        order_by: index + 1,
      }));

      // Update order in database
      for (const step of reorderedSteps) {
        await supabase
          .from("humor_flavor_steps")
          .update({ order_by: step.order_by })
          .eq("id", step.id);
      }

      setSteps(reorderedSteps);
      setIsDeleteStepDialogOpen(false);
      setSelectedStep(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete step");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditStepModal = (step: HumorFlavorStep) => {
    setSelectedStep(step);
    setStepFormData({
      description: step.description || "",
      llm_model_id: step.llm_model_id,
      llm_input_type_id: step.llm_input_type_id,
      llm_output_type_id: step.llm_output_type_id,
      humor_flavor_step_type_id: step.humor_flavor_step_type_id,
      llm_temperature: step.llm_temperature?.toString() || "",
      llm_system_prompt: step.llm_system_prompt || "",
      llm_user_prompt: step.llm_user_prompt || "",
    });
    setError(null);
    setIsEditStepModalOpen(true);
  };

  const handleMoveStep = useCallback(
    async (stepId: number, direction: "up" | "down") => {
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      if (currentIndex === -1) return;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= steps.length) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const newSteps = [...steps];
        [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];

        // Update order_by for both steps
        const updatedSteps = newSteps.map((s, index) => ({
          ...s,
          order_by: index + 1,
        }));

        // Update in database
        await Promise.all([
          supabase
            .from("humor_flavor_steps")
            .update({ order_by: updatedSteps[currentIndex].order_by })
            .eq("id", updatedSteps[currentIndex].id),
          supabase
            .from("humor_flavor_steps")
            .update({ order_by: updatedSteps[newIndex].order_by })
            .eq("id", updatedSteps[newIndex].id),
        ]);

        setSteps(updatedSteps);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reorder steps");
      } finally {
        setIsLoading(false);
      }
    },
    [steps, router]
  );

  const handleDragStart = (stepId: number) => {
    setDraggedStepId(stepId);
  };

  const handleDragOver = (e: React.DragEvent, targetStepId: number) => {
    e.preventDefault();
    if (draggedStepId === null || draggedStepId === targetStepId) return;
  };

  const handleDrop = async (e: React.DragEvent, targetStepId: number) => {
    e.preventDefault();
    if (draggedStepId === null || draggedStepId === targetStepId) return;

    const draggedIndex = steps.findIndex((s) => s.id === draggedStepId);
    const targetIndex = steps.findIndex((s) => s.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const newSteps = [...steps];
      const [removed] = newSteps.splice(draggedIndex, 1);
      newSteps.splice(targetIndex, 0, removed);

      const updatedSteps = newSteps.map((s, index) => ({
        ...s,
        order_by: index + 1,
      }));

      // Update all order_by values in database
      await Promise.all(
        updatedSteps.map((step) =>
          supabase
            .from("humor_flavor_steps")
            .update({ order_by: step.order_by })
            .eq("id", step.id)
        )
      );

      setSteps(updatedSteps);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder steps");
    } finally {
      setIsLoading(false);
      setDraggedStepId(null);
    }
  };

  const getModelName = (id: number) => llmModels.find((m) => m.id === id)?.name || "Unknown";
  const getInputTypeName = (id: number) => llmInputTypes.find((t) => t.id === id)?.slug || "Unknown";
  const getOutputTypeName = (id: number) => llmOutputTypes.find((t) => t.id === id)?.slug || "Unknown";
  const getStepTypeName = (id: number) => stepTypes.find((t) => t.id === id)?.slug || "Unknown";

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <AdminHeader profile={profile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Humor Flavors
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-bold">{flavor.slug}</span>
        </nav>

        {/* Flavor Info Card */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                  {flavor.slug}
                </h1>
                <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  ID: {flavor.id}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {flavor.description || "No description provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-8 bg-gradient-to-r from-primary to-accent rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
              Prompt Chain Steps
            </h2>
            <span className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs font-bold">
              {steps.length} {steps.length === 1 ? "step" : "steps"}
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsTestModalOpen(true)}>
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Test
            </Button>
            <Link href={`/admin/flavors/${flavor.id}/captions`}>
              <Button variant="secondary">
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                View Captions
              </Button>
            </Link>
            <Button
              onClick={() => {
                setStepFormData({
                  ...defaultStepFormData,
                  llm_model_id: llmModels[0]?.id || 0,
                  llm_input_type_id: llmInputTypes[0]?.id || 0,
                  llm_output_type_id: llmOutputTypes[0]?.id || 0,
                  humor_flavor_step_type_id: stepTypes[0]?.id || 0,
                });
                setError(null);
                setIsCreateStepModalOpen(true);
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
              Add Step
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Steps List */}
        {steps.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No Steps Configured
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first step to start building this prompt chain.
            </p>
            <Button onClick={() => setIsCreateStepModalOpen(true)}>
              Add First Step
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(step.id)}
                onDragOver={(e) => handleDragOver(e, step.id)}
                onDrop={(e) => handleDrop(e, step.id)}
                className={`glass-card group relative rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-move ${
                  draggedStepId === step.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black text-lg shadow-lg shadow-primary/25">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveStep(step.id, "up")}
                        disabled={index === 0 || isLoading}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveStep(step.id, "down")}
                        disabled={index === steps.length - 1 || isLoading}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {step.description || `Step ${index + 1}`}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            {getStepTypeName(step.humor_flavor_step_type_id)}
                          </span>
                          {step.llm_temperature && (
                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-muted-foreground text-[10px] font-bold">
                              Temp: {step.llm_temperature}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditStepModal(step)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStep(step);
                            setIsDeleteStepDialogOpen(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Model
                        </span>
                        <p className="text-foreground font-medium">{getModelName(step.llm_model_id)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Input Type
                        </span>
                        <p className="text-foreground">{getInputTypeName(step.llm_input_type_id)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Output Type
                        </span>
                        <p className="text-foreground">{getOutputTypeName(step.llm_output_type_id)}</p>
                      </div>
                    </div>

                    {(step.llm_system_prompt || step.llm_user_prompt) && (
                      <div className="mt-4 space-y-3">
                        {step.llm_system_prompt && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              System Prompt
                            </span>
                            <pre className="text-sm text-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mt-1 font-mono whitespace-pre-wrap break-words select-text cursor-text">
                              {step.llm_system_prompt}
                            </pre>
                          </div>
                        )}
                        {step.llm_user_prompt && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              User Prompt
                            </span>
                            <pre className="text-sm text-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mt-1 font-mono whitespace-pre-wrap break-words select-text cursor-text">
                              {step.llm_user_prompt}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[39px] -bottom-4 w-0.5 h-4 bg-gradient-to-b from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Step Modal */}
      <Modal
        isOpen={isCreateStepModalOpen}
        onClose={() => setIsCreateStepModalOpen(false)}
        title="Add New Step"
        size="3xl"
      >
        <StepForm
          formData={stepFormData}
          setFormData={setStepFormData}
          modelOptions={modelOptions}
          inputTypeOptions={inputTypeOptions}
          outputTypeOptions={outputTypeOptions}
          stepTypeOptions={stepTypeOptions}
          llmModels={llmModels}
          error={error}
          isLoading={isLoading}
          onSubmit={handleCreateStep}
          onCancel={() => setIsCreateStepModalOpen(false)}
          submitText="Add Step"
        />
      </Modal>

      {/* Edit Step Modal */}
      <Modal
        isOpen={isEditStepModalOpen}
        onClose={() => setIsEditStepModalOpen(false)}
        title="Edit Step"
        size="3xl"
      >
        <StepForm
          formData={stepFormData}
          setFormData={setStepFormData}
          modelOptions={modelOptions}
          inputTypeOptions={inputTypeOptions}
          outputTypeOptions={outputTypeOptions}
          stepTypeOptions={stepTypeOptions}
          llmModels={llmModels}
          error={error}
          isLoading={isLoading}
          onSubmit={handleUpdateStep}
          onCancel={() => setIsEditStepModalOpen(false)}
          submitText="Save Changes"
        />
      </Modal>

      {/* Delete Step Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteStepDialogOpen}
        onClose={() => setIsDeleteStepDialogOpen(false)}
        onConfirm={handleDeleteStep}
        title="Delete Step"
        message={`Are you sure you want to delete "${selectedStep?.description || `Step ${steps.findIndex(s => s.id === selectedStep?.id) + 1}`}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={isLoading}
      />

      {/* Test Modal */}
      <TestFlavorModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        flavor={flavor}
        studyImageSets={studyImageSets}
      />
    </div>
  );
}

// Step Form Component
interface StepFormProps {
  formData: StepFormData;
  setFormData: React.Dispatch<React.SetStateAction<StepFormData>>;
  modelOptions: { value: number; label: string }[];
  inputTypeOptions: { value: number; label: string }[];
  outputTypeOptions: { value: number; label: string }[];
  stepTypeOptions: { value: number; label: string }[];
  llmModels: LlmModel[];
  error: string | null;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitText: string;
}

function StepForm({
  formData,
  setFormData,
  modelOptions,
  inputTypeOptions,
  outputTypeOptions,
  stepTypeOptions,
  llmModels,
  error,
  isLoading,
  onSubmit,
  onCancel,
  submitText,
}: StepFormProps) {
  const selectedModel = llmModels.find((m) => m.id === formData.llm_model_id);
  const isTemperatureSupported = selectedModel?.is_temperature_supported ?? true;
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Input
        label="Description"
        placeholder="e.g., Describe the image in detail"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Step Type"
          options={stepTypeOptions}
          value={formData.humor_flavor_step_type_id}
          onChange={(e) =>
            setFormData({ ...formData, humor_flavor_step_type_id: parseInt(e.target.value) })
          }
        />
        <Select
          label="LLM Model"
          options={modelOptions}
          value={formData.llm_model_id}
          onChange={(e) =>
            setFormData({ ...formData, llm_model_id: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Input Type"
          options={inputTypeOptions}
          value={formData.llm_input_type_id}
          onChange={(e) =>
            setFormData({ ...formData, llm_input_type_id: parseInt(e.target.value) })
          }
        />
        <Select
          label="Output Type"
          options={outputTypeOptions}
          value={formData.llm_output_type_id}
          onChange={(e) =>
            setFormData({ ...formData, llm_output_type_id: parseInt(e.target.value) })
          }
        />
      </div>

      {isTemperatureSupported ? (
        <Input
          label="Temperature"
          type="number"
          step="0.1"
          min="0"
          max="2"
          placeholder="e.g., 0.7"
          value={formData.llm_temperature}
          onChange={(e) => setFormData({ ...formData, llm_temperature: e.target.value })}
        />
      ) : (
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm text-muted-foreground">
          Temperature is not supported by {selectedModel?.name || "this model"}
        </div>
      )}

      <Textarea
        label="System Prompt"
        placeholder="Enter the system prompt for this step..."
        value={formData.llm_system_prompt}
        onChange={(e) => setFormData({ ...formData, llm_system_prompt: e.target.value })}
        className="min-h-[100px]"
      />

      <Textarea
        label="User Prompt"
        placeholder="Enter the user prompt template for this step..."
        value={formData.llm_user_prompt}
        onChange={(e) => setFormData({ ...formData, llm_user_prompt: e.target.value })}
        className="min-h-[100px]"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end pt-4 sticky bottom-0 bg-card-bg">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={isLoading}>
          {submitText}
        </Button>
      </div>
    </div>
  );
}
