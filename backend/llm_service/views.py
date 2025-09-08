from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import LLMModel, Conversation, Message, UserPreference
from .serializers import (
    LLMModelSerializer, ConversationSerializer, ConversationListSerializer,
    ChatRequestSerializer, ChatResponseSerializer, UserPreferenceSerializer,
    MessageSerializer, ModelTestSerializer
)
from .llm_engines import LLMEngineFactory
from .services import LLMService
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class LLMModelListView(generics.ListAPIView):
    queryset = LLMModel.objects.filter(is_active=True)
    serializer_class = LLMModelSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConversationListView(generics.ListCreateAPIView):
    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(
            user=self.request.user,
            is_archived=False
        ).select_related('model').prefetch_related('messages')


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(
            Conversation, 
            id=conversation_id, 
            user=self.request.user
        )
        return Message.objects.filter(conversation=conversation)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chat(request):
    """Main chat endpoint for LLM interactions"""
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        llm_service = LLMService()
        result = llm_service.process_chat_request(
            user=request.user,
            **serializer.validated_data
        )
        
        response_serializer = ChatResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return Response(
            {'error': 'Failed to process chat request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def stream_chat(request):
    """Streaming chat endpoint"""
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        llm_service = LLMService()
        
        def generate():
            for chunk in llm_service.process_stream_chat_request(
                user=request.user,
                **serializer.validated_data
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        
        from django.http import StreamingHttpResponse
        return StreamingHttpResponse(
            generate(), 
            content_type='text/plain'
        )
        
    except Exception as e:
        logger.error(f"Stream chat error: {str(e)}")
        return Response(
            {'error': 'Failed to process stream chat request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_preferences(request):
    """Get user LLM preferences"""
    preferences, created = UserPreference.objects.get_or_create(user=request.user)
    serializer = UserPreferenceSerializer(preferences)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_user_preferences(request):
    """Update user LLM preferences"""
    preferences, created = UserPreference.objects.get_or_create(user=request.user)
    serializer = UserPreferenceSerializer(preferences, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_model(request):
    """Test a specific model with a custom prompt"""
    serializer = ModelTestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        model = get_object_or_404(LLMModel, id=serializer.validated_data['model_id'])
        llm_service = LLMService()
        
        response = llm_service.test_model(
            model=model,
            prompt=serializer.validated_data['test_prompt'],
            temperature=serializer.validated_data['temperature'],
            max_tokens=serializer.validated_data['max_tokens']
        )
        
        return Response({
            'model': model.name,
            'response': response,
            'test_prompt': serializer.validated_data['test_prompt']
        })
        
    except Exception as e:
        logger.error(f"Model test error: {str(e)}")
        return Response(
            {'error': 'Failed to test model'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_conversations(request):
    """Search conversations by title or content"""
    query = request.GET.get('q', '')
    if not query:
        return Response({'conversations': []})
    
    conversations = Conversation.objects.filter(
        user=request.user,
        is_archived=False
    ).filter(
        Q(title__icontains=query) | 
        Q(messages__content__icontains=query)
    ).distinct().select_related('model').prefetch_related('messages')
    
    serializer = ConversationListSerializer(conversations, many=True)
    return Response({'conversations': serializer.data})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def archive_conversation(request, conversation_id):
    """Archive a conversation"""
    conversation = get_object_or_404(
        Conversation, 
        id=conversation_id, 
        user=request.user
    )
    conversation.is_archived = True
    conversation.save()
    return Response({'message': 'Conversation archived'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unarchive_conversation(request, conversation_id):
    """Unarchive a conversation"""
    conversation = get_object_or_404(
        Conversation, 
        id=conversation_id, 
        user=request.user
    )
    conversation.is_archived = False
    conversation.save()
    return Response({'message': 'Conversation unarchived'})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Delete a conversation permanently"""
    conversation = get_object_or_404(
        Conversation, 
        id=conversation_id, 
        user=request.user
    )
    conversation.delete()
    return Response({'message': 'Conversation deleted'})
