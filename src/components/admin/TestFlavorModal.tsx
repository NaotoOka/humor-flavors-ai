"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { uploadImageToPipeline, pipelineApi } from "@/lib/api";
import type { HumorFlavor, StudyImageSet } from "@/lib/types";

interface TestFlavorModalProps {
  isOpen: boolean;
  onClose: () => void;
  flavor: HumorFlavor;
  studyImageSets: StudyImageSet[];
}

type TestStep = "upload" | "generating" | "done";
type ImageSource = "upload" | "study-set";

export function TestFlavorModal({
  isOpen,
  onClose,
  flavor,
  studyImageSets,
}: TestFlavorModalProps) {
  const [imageSource, setImageSource] = useState<ImageSource>("upload");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStudyImageSetId, setSelectedStudyImageSetId] = useState<string>("");
  const [selectedStudyImageId, setSelectedStudyImageId] = useState<string>("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<TestStep>("upload");

  const studyImageSetOptions = studyImageSets.map((set) => ({
    value: set.id.toString(),
    label: `${set.slug} (${set.images.length})`,
  }));

  const selectedStudyImageSet = studyImageSets.find(
    (set) => set.id.toString() === selectedStudyImageSetId
  );

  const selectedStudyImage = selectedStudyImageSet?.images.find(
    (img) => img.id === selectedStudyImageId
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageSource("upload");
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setCaptions([]);
      setStep("upload");
    }
  };

  const handleRunTest = async () => {
    if (imageSource === "upload" && !image) {
      setError("Please upload an image first");
      return;
    }

    if (imageSource === "study-set" && !selectedStudyImage) {
      setError("Please select a study image first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep("generating");

    try {
      let imageId: string;

      if (imageSource === "study-set" && selectedStudyImage) {
        imageId = selectedStudyImage.id;
      } else {
        const uploadedImage = await uploadImageToPipeline(image as File);
        imageId = uploadedImage.imageId;
      }

      const captionsResponse = await pipelineApi.generateCaptions(imageId, flavor.id);

      const captionTexts = (captionsResponse as Array<{ content?: string }>)
        .map((c) => c.content)
        .filter((c): c is string => !!c);

      setCaptions(captionTexts);
      setGenerationId((prev) => prev + 1);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate captions");
      setStep("upload");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImageSource("upload");
    setImage(null);
    setImagePreview(null);
    setSelectedStudyImageSetId("");
    setSelectedStudyImageId("");
    setCaptions([]);
    setGenerationId(0);
    setError(null);
    setStep("upload");
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Test: ${flavor.slug}`}
      size="3xl"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Select
            label="Image Source"
            value={imageSource}
            onChange={(e) => {
              setImageSource(e.target.value as ImageSource);
              setError(null);
              setCaptions([]);
              setStep("upload");
            }}
            options={[
              { value: "upload", label: "Upload image" },
              { value: "study-set", label: "Study image set" },
            ]}
            disabled={isLoading}
          />
        </div>

        {imageSource === "upload" ? (
          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Upload Test Image
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                imagePreview
                  ? "border-primary/50 bg-primary/5"
                  : "border-card-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Test preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground">{image?.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    Click or drag an image to upload
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Supports JPEG, PNG, WebP, GIF, HEIC
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Study Image Set"
              value={selectedStudyImageSetId}
              onChange={(e) => {
                setSelectedStudyImageSetId(e.target.value);
                setSelectedStudyImageId("");
                setImage(null);
                setImagePreview(null);
                setError(null);
                setCaptions([]);
                setStep("upload");
              }}
              options={studyImageSetOptions}
              placeholder={
                studyImageSetOptions.length > 0
                  ? "Choose a study image set"
                  : "No study image sets available"
              }
              disabled={isLoading || studyImageSetOptions.length === 0}
            />

            {selectedStudyImageSet?.description && (
              <p className="text-xs text-muted-foreground">
                {selectedStudyImageSet.description}
              </p>
            )}

            {/* Image Gallery */}
            {selectedStudyImageSet && selectedStudyImageSet.images.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Select an Image
                </label>
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                  {selectedStudyImageSet.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudyImageId(img.id);
                        setError(null);
                        setCaptions([]);
                        setStep("upload");
                      }}
                      disabled={isLoading}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        selectedStudyImageId === img.id
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-card-border hover:border-primary/50"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={img.image_description || "Study image"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {selectedStudyImageId === img.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full p-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected image details */}
            {selectedStudyImage && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm font-medium text-foreground">
                  {selectedStudyImage.image_description || "Selected image"}
                </p>
                {selectedStudyImage.url && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {selectedStudyImage.url.split("/").pop()}
                  </p>
                )}
              </div>
            )}

            {selectedStudyImageSet && selectedStudyImageSet.images.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No images in this set</p>
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {step === "generating" ? "Generating captions..." : "Processing..."}
              </p>
              <p className="text-xs text-muted-foreground">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Generated Captions */}
        {captions.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Generated Captions
            </label>
            <div className="space-y-2">
              {captions.map((caption, index) => (
                <div
                  key={`${generationId}-${index}`}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-card-border"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm text-foreground">{caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-card-border">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          {captions.length > 0 ? (
            <Button onClick={reset}>Test Another Image</Button>
          ) : (
            <Button
              onClick={handleRunTest}
              loading={isLoading}
              disabled={imageSource === "upload" ? !image : !selectedStudyImage}
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Generate Captions
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
