from django.contrib import admin
from .models import LLMModel, Conversation, Message, UserPreference


@admin.register(LLMModel)
class LLMModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'model_type', 'model_id', 'is_active', 'max_tokens', 'temperature', 'created_at')
    list_filter = ('model_type', 'is_active', 'created_at')
    search_fields = ('name', 'model_id', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'model_type', 'model_id', 'description', 'is_active')
        }),
        ('Parameters', {
            'fields': ('max_tokens', 'temperature', 'top_p')
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'model', 'message_count', 'is_archived', 'created_at', 'updated_at')
    list_filter = ('is_archived', 'model', 'created_at')
    search_fields = ('title', 'user__email', 'user__username')
    ordering = ('-updated_at',)
    raw_id_fields = ('user', 'model')
    
    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'content_preview', 'tokens_used', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('content', 'conversation__title', 'conversation__user__email')
    ordering = ('-created_at',)
    raw_id_fields = ('conversation',)
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'default_model', 'default_temperature', 'default_max_tokens', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__username')
    raw_id_fields = ('user', 'default_model')
    filter_horizontal = ('preferred_models',)
