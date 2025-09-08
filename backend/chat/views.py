from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatSessionListSerializer, ChatMessageSerializer
import uuid

User = get_user_model()


class ChatSessionListView(generics.ListCreateAPIView):
    serializer_class = ChatSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        session_id = str(uuid.uuid4())
        serializer.save(user=self.request.user, session_id=session_id)


class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class ChatMessageListView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        session_id = self.kwargs['session_id']
        session = get_object_or_404(
            ChatSession, 
            session_id=session_id, 
            user=self.request.user
        )
        return ChatMessage.objects.filter(session=session)
    
    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        session = get_object_or_404(
            ChatSession, 
            session_id=session_id, 
            user=self.request.user
        )
        serializer.save(session=session)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_session(request):
    """Create a new chat session"""
    session_id = str(uuid.uuid4())
    session = ChatSession.objects.create(
        user=request.user,
        session_id=session_id
    )
    serializer = ChatSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_session(request, session_id):
    """End a chat session"""
    session = get_object_or_404(
        ChatSession, 
        session_id=session_id, 
        user=request.user
    )
    session.is_active = False
    session.save()
    return Response({'message': 'Session ended'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def session_messages(request, session_id):
    """Get all messages for a session"""
    session = get_object_or_404(
        ChatSession, 
        session_id=session_id, 
        user=request.user
    )
    messages = ChatMessage.objects.filter(session=session)
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)
