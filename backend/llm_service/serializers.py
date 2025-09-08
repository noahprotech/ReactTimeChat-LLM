from rest_framework import serializers
from .models import LLMModel, Conversation, Message, UserPreference


class LLMModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLMModel
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'tokens_used', 'created_at', 'metadata']
        read_only_fields = ['id', 'tokens_used', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'model', 'model_name', 'created_at', 'updated_at', 
                 'is_archived', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'message_count']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationListSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='model.name', read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'model', 'model_name', 'created_at', 'updated_at', 
                 'is_archived', 'message_count', 'last_message']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'role': last_msg.role,
                'created_at': last_msg.created_at
            }
        return None


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=10000)
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    model_id = serializers.IntegerField(required=False)
    temperature = serializers.FloatField(min_value=0.0, max_value=2.0, default=0.7)
    max_tokens = serializers.IntegerField(min_value=1, max_value=8192, default=2048)
    top_p = serializers.FloatField(min_value=0.0, max_value=1.0, default=0.9)
    stream = serializers.BooleanField(default=False)
    system_prompt = serializers.CharField(max_length=5000, required=False, allow_blank=True)


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    conversation_id = serializers.IntegerField()
    message_id = serializers.IntegerField()
    tokens_used = serializers.IntegerField()
    model_used = serializers.CharField()


class UserPreferenceSerializer(serializers.ModelSerializer):
    default_model_name = serializers.CharField(source='default_model.name', read_only=True)
    preferred_models = LLMModelSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserPreference
        fields = ['default_model', 'default_model_name', 'default_temperature', 
                 'default_max_tokens', 'preferred_models', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ModelTestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField()
    test_prompt = serializers.CharField(max_length=1000, default="Hello, how are you?")
    temperature = serializers.FloatField(min_value=0.0, max_value=2.0, default=0.7)
    max_tokens = serializers.IntegerField(min_value=1, max_value=8192, default=100)
