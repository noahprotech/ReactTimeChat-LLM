import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '@/services/api';
import { 
  LLMModel, 
  Conversation, 
  Message, 
  ChatRequest, 
  ChatResponse, 
  UserPreference,
  ApiError 
} from '@/types';
import toast from 'react-hot-toast';

export const useLLM = () => {
  const queryClient = useQueryClient();

  // Get available models
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['models'],
    queryFn: () => apiService.getModels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiService.getConversations(),
  });

  // Get user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiService.getUserPreferences(),
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (data: { title: string; model: number }) => apiService.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      toast.success('Conversation created!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create conversation');
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Conversation> }) =>
      apiService.updateConversation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update conversation');
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      toast.success('Conversation deleted');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });

  // Archive conversation mutation
  const archiveConversationMutation = useMutation({
    mutationFn: (id: number) => apiService.archiveConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      toast.success('Conversation archived');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to archive conversation');
    },
  });

  // Unarchive conversation mutation
  const unarchiveConversationMutation = useMutation({
    mutationFn: (id: number) => apiService.unarchiveConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      toast.success('Conversation unarchived');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to unarchive conversation');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: ChatRequest) => apiService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserPreference>) => apiService.updateUserPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['preferences']);
      toast.success('Preferences updated!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });

  // Test model mutation
  const testModelMutation = useMutation({
    mutationFn: ({ modelId, prompt, temperature, maxTokens }: {
      modelId: number;
      prompt: string;
      temperature?: number;
      maxTokens?: number;
    }) => apiService.testModel(modelId, prompt, temperature, maxTokens),
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to test model');
    },
  });

  // Search conversations mutation
  const searchConversationsMutation = useMutation({
    mutationFn: (query: string) => apiService.searchConversations(query),
    onError: (error: ApiError) => {
      toast.error(error.message || 'Search failed');
    },
  });

  return {
    // Data
    models,
    conversations,
    preferences,
    
    // Loading states
    isLoadingModels,
    isLoadingConversations,
    isLoadingPreferences,
    
    // Mutations
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    archiveConversation: archiveConversationMutation.mutateAsync,
    unarchiveConversation: unarchiveConversationMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    testModel: testModelMutation.mutateAsync,
    searchConversations: searchConversationsMutation.mutateAsync,
    
    // Mutation states
    isCreatingConversation: createConversationMutation.isPending,
    isUpdatingConversation: updateConversationMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
    isArchivingConversation: archiveConversationMutation.isPending,
    isUnarchivingConversation: unarchiveConversationMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isTestingModel: testModelMutation.isPending,
    isSearchingConversations: searchConversationsMutation.isPending,
  };
};

export const useConversation = (id: number) => {
  const queryClient = useQueryClient();

  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => apiService.getConversation(id),
    enabled: !!id,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => apiService.getMessages(id),
    enabled: !!id,
  });

  const refreshConversation = () => {
    queryClient.invalidateQueries(['conversation', id]);
    queryClient.invalidateQueries(['messages', id]);
  };

  return {
    conversation,
    messages,
    isLoading: isLoading || isLoadingMessages,
    error,
    refreshConversation,
  };
};
