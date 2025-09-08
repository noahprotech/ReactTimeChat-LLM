import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User, 
  UserPreference,
  LLMModel,
  Conversation,
  Message,
  ChatRequest,
  ChatResponse,
  ChatSession,
  ChatMessage,
  PaginatedResponse,
  ApiError
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.data.access);
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
    };

    if (error.response?.data) {
      const data = error.response.data as any;
      if (typeof data === 'string') {
        apiError.message = data;
      } else if (data.message) {
        apiError.message = data.message;
      } else if (data.detail) {
        apiError.message = data.detail;
      } else if (data.error) {
        apiError.message = data.error;
      }
      apiError.details = data;
    }

    return apiError;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login/', credentials);
    const data = response.data;
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register/', data);
    const authData = response.data;
    localStorage.setItem('access_token', authData.access);
    localStorage.setItem('refresh_token', authData.refresh);
    return authData;
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<{ access: string }>> {
    return this.api.post('/auth/token/refresh/', { refresh: refreshToken });
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.api.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get('/auth/profile/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put('/auth/profile/update/', data);
    return response.data;
  }

  async changePassword(data: { old_password: string; new_password: string; new_password_confirm: string }): Promise<void> {
    await this.api.post('/auth/change-password/', data);
  }

  // LLM endpoints
  async getModels(): Promise<LLMModel[]> {
    const response = await this.api.get('/llm/models/');
    return response.data;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.api.get('/llm/conversations/');
    return response.data;
  }

  async getConversation(id: number): Promise<Conversation> {
    const response = await this.api.get(`/llm/conversations/${id}/`);
    return response.data;
  }

  async createConversation(data: { title: string; model: number }): Promise<Conversation> {
    const response = await this.api.post('/llm/conversations/', data);
    return response.data;
  }

  async updateConversation(id: number, data: Partial<Conversation>): Promise<Conversation> {
    const response = await this.api.patch(`/llm/conversations/${id}/`, data);
    return response.data;
  }

  async deleteConversation(id: number): Promise<void> {
    await this.api.delete(`/llm/conversations/${id}/delete/`);
  }

  async archiveConversation(id: number): Promise<void> {
    await this.api.post(`/llm/conversations/${id}/archive/`);
  }

  async unarchiveConversation(id: number): Promise<void> {
    await this.api.post(`/llm/conversations/${id}/unarchive/`);
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await this.api.get(`/llm/conversations/${conversationId}/messages/`);
    return response.data;
  }

  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await this.api.post('/llm/chat/', data);
    return response.data;
  }

  async sendStreamMessage(data: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.api.defaults.baseURL}/llm/chat/stream/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  }

  async getUserPreferences(): Promise<UserPreference> {
    const response = await this.api.get('/llm/preferences/');
    return response.data;
  }

  async updateUserPreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    const response = await this.api.put('/llm/preferences/update/', data);
    return response.data;
  }

  async testModel(modelId: number, prompt: string, temperature: number = 0.7, maxTokens: number = 100): Promise<{ model: string; response: string; test_prompt: string }> {
    const response = await this.api.post('/llm/test-model/', {
      model_id: modelId,
      test_prompt: prompt,
      temperature,
      max_tokens: maxTokens,
    });
    return response.data;
  }

  async searchConversations(query: string): Promise<{ conversations: Conversation[] }> {
    const response = await this.api.get(`/llm/conversations/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Chat session endpoints
  async getChatSessions(): Promise<ChatSession[]> {
    const response = await this.api.get('/chat/sessions/');
    return response.data;
  }

  async createChatSession(): Promise<ChatSession> {
    const response = await this.api.post('/chat/sessions/create/');
    return response.data;
  }

  async getChatSession(id: number): Promise<ChatSession> {
    const response = await this.api.get(`/chat/sessions/${id}/`);
    return response.data;
  }

  async endChatSession(sessionId: string): Promise<void> {
    await this.api.post(`/chat/sessions/${sessionId}/end/`);
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.api.get(`/chat/sessions/${sessionId}/messages/`);
    return response.data;
  }

  async sendChatMessage(sessionId: string, data: { message_type: string; content: string; metadata?: Record<string, any> }): Promise<ChatMessage> {
    const response = await this.api.post(`/chat/sessions/${sessionId}/messages/`, data);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
