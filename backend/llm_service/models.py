from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class LLMModel(models.Model):
    MODEL_TYPES = [
        ('huggingface', 'Hugging Face'),
        ('ollama', 'Ollama'),
        ('custom', 'Custom API'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    model_type = models.CharField(max_length=20, choices=MODEL_TYPES)
    model_id = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    max_tokens = models.IntegerField(default=2048)
    temperature = models.FloatField(default=0.7)
    top_p = models.FloatField(default=0.9)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    config = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.model_type})"


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=200)
    model = models.ForeignKey(LLMModel, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"


class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.conversation.title} - {self.role}"


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='llm_preferences')
    default_model = models.ForeignKey(LLMModel, on_delete=models.SET_NULL, null=True, blank=True)
    default_temperature = models.FloatField(default=0.7)
    default_max_tokens = models.IntegerField(default=2048)
    preferred_models = models.ManyToManyField(LLMModel, blank=True, related_name='preferred_by_users')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} preferences"
