export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_verified: boolean;
  created_at: string;
  avatar?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio: string;
  location: string;
  website: string;
  birth_date?: string;
  phone_number: string;
  preferences: Record<string, any>;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LLMModel {
  id: number;
  name: string;
  model_type: 'huggingface' | 'ollama' | 'custom';
  model_id: string;
  description: string;
  is_active: boolean;
  max_tokens: number;
  temperature: number;
  top_p: number;
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
}

export interface Conversation {
  id: number;
  title: string;
  model: number;
  model_name: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  messages: Message[];
  message_count: number;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
  model_id?: number;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  system_prompt?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: number;
  message_id: number;
  tokens_used: number;
  model_used: string;
}

export interface UserPreference {
  default_model?: number;
  default_model_name?: string;
  default_temperature: number;
  default_max_tokens: number;
  preferred_models: LLMModel[];
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: number;
  session_id: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  messages: ChatMessage[];
  message_count: number;
}

export interface ChatMessage {
  id: number;
  message_type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
