// Common audit fields present in most tables
export interface AuditFields {
  created_by_user_id: string;
  modified_by_user_id: string;
  modified_datetime_utc: string;
}

// Profile types
export interface Profile {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean;
  is_matrix_admin: boolean;
  is_in_study: boolean;
  created_by_user_id: string;
  modified_by_user_id: string;
}

// Humor Flavor types
export interface HumorFlavor {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  description: string | null;
  slug: string;
  created_by_user_id: string;
  modified_by_user_id: string;
}

export interface HumorFlavorStep {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
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
  created_by_user_id: string;
  modified_by_user_id: string;
}

export interface HumorFlavorStepType {
  id: number;
  created_at: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  slug: string;
  description: string;
  created_by_user_id: string;
  modified_by_user_id: string;
}

// LLM related types
export interface LlmInputType {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  description: string;
  slug: string;
  created_by_user_id: string;
  modified_by_user_id: string;
}

export interface LlmOutputType {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  description: string;
  slug: string;
  created_by_user_id: string;
  modified_by_user_id: string;
}

export interface LlmModel {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
  created_by_user_id: string;
  modified_by_user_id: string;
}

export interface LlmProvider {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  name: string;
  created_by_user_id: string;
  modified_by_user_id: string;
}

// Caption types
export interface Caption {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  content: string | null;
  is_public: boolean;
  profile_id: string;
  image_id: string;
  humor_flavor_id: number | null;
  is_featured: boolean;
  like_count: number;
  caption_request_id: number | null;
  llm_prompt_chain_id: number | null;
  created_by_user_id: string;
  modified_by_user_id: string;
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
  modified_datetime_utc: string;
  url: string | null;
  is_common_use: boolean;
  profile_id: string | null;
  additional_context: string | null;
  is_public: boolean;
  image_description: string | null;
  celebrity_recognition: string | null;
  created_by_user_id: string;
  modified_by_user_id: string;
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
  // Optional audit fields - may not be present in partial views
  created_datetime_utc?: string;
  modified_datetime_utc?: string;
  created_by_user_id?: string;
  modified_by_user_id?: string;
}

// Study types
export interface Study {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  slug: string | null;
  description: string | null;
  start_datetime_utc: string | null;
  end_datetime_utc: string | null;
  is_hidden: boolean;
  created_by_user_id: string;
  modified_by_user_id: string;
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
