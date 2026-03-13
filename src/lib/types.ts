// Profile types
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean;
  is_matrix_admin: boolean;
}

// Humor Flavor types
export interface HumorFlavor {
  id: number;
  created_datetime_utc: string;
  description: string | null;
  slug: string;
}

export interface HumorFlavorStep {
  id: number;
  created_datetime_utc: string;
  humor_flavor_id: number;
  llm_temperature: number | null;
  order_by: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  description: string | null;
}

export interface HumorFlavorStepType {
  id: number;
  created_at: string;
  slug: string;
  description: string;
}

// LLM related types
export interface LlmInputType {
  id: number;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

export interface LlmOutputType {
  id: number;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

export interface LlmModel {
  id: number;
  created_datetime_utc: string;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
}

export interface LlmProvider {
  id: number;
  created_datetime_utc: string;
  name: string;
}

// Caption types
export interface Caption {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  content: string | null;
  is_public: boolean;
  profile_id: string;
  image_id: string;
  humor_flavor_id: number | null;
  is_featured: boolean;
  like_count: number;
}

export interface CaptionWithImage extends Caption {
  images: {
    id: string;
    url: string | null;
  };
}

// Image types
export interface Image {
  id: string;
  created_datetime_utc: string;
  url: string | null;
  is_common_use: boolean;
  profile_id: string | null;
  image_description: string | null;
}

export interface StudyImageSetImage {
  id: string;
  url: string | null;
  image_description: string | null;
}

export interface StudyImageSet {
  id: number;
  slug: string;
  description: string | null;
  images: StudyImageSetImage[];
}

// Form types for creating/updating
export interface CreateHumorFlavorInput {
  slug: string;
  description: string | null;
}

export interface UpdateHumorFlavorInput {
  slug?: string;
  description?: string | null;
}

export interface CreateHumorFlavorStepInput {
  humor_flavor_id: number;
  order_by: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_temperature?: number | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
  description?: string | null;
}

export interface UpdateHumorFlavorStepInput {
  order_by?: number;
  llm_input_type_id?: number;
  llm_output_type_id?: number;
  llm_model_id?: number;
  humor_flavor_step_type_id?: number;
  llm_temperature?: number | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
  description?: string | null;
}

// API response types
export interface ApiError {
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
