from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.ChatSessionListView.as_view(), name='chat-session-list'),
    path('sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('sessions/<str:session_id>/messages/', views.ChatMessageListView.as_view(), name='chat-message-list'),
    path('sessions/create/', views.create_session, name='create-session'),
    path('sessions/<str:session_id>/end/', views.end_session, name='end-session'),
    path('sessions/<str:session_id>/messages/', views.session_messages, name='session-messages'),
]
