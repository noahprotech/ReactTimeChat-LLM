from django.urls import path
from . import views

urlpatterns = [
    path('models/', views.LLMModelListView.as_view(), name='model-list'),
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('chat/', views.chat, name='chat'),
    path('chat/stream/', views.stream_chat, name='stream-chat'),
    path('preferences/', views.user_preferences, name='user-preferences'),
    path('preferences/update/', views.update_user_preferences, name='update-preferences'),
    path('test-model/', views.test_model, name='test-model'),
    path('conversations/search/', views.search_conversations, name='search-conversations'),
    path('conversations/<int:conversation_id>/archive/', views.archive_conversation, name='archive-conversation'),
    path('conversations/<int:conversation_id>/unarchive/', views.unarchive_conversation, name='unarchive-conversation'),
    path('conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete-conversation'),
]
