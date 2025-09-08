from typing import Dict, List, Optional, Generator, Any
from django.contrib.auth import get_user_model
from .models import LLMModel, Conversation, Message, UserPreference
from .llm_engines import LLMEngineFactory
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()


class LLMService:
    """Main service class for LLM operations"""
    
    def __init__(self):
        self.engine_cache = {}
    
    def _get_engine(self, model: LLMModel):
        """Get or create engine for a model with caching"""
        cache_key = f"{model.model_type}_{model.model_id}"
        
        if cache_key not in self.engine_cache:
            try:
                engine_kwargs = {
                    'model_id': model.model_id,
                    **model.config
                }
                
                if model.model_type == 'ollama':
                    engine_kwargs['model_name'] = model.model_id
                elif model.model_type == 'custom':
                    engine_kwargs['api_url'] = model.config.get('api_url', '')
                    engine_kwargs['api_key'] = model.config.get('api_key', '')
                
                self.engine_cache[cache_key] = LLMEngineFactory.create_engine(
                    model.model_type, **engine_kwargs
                )
            except Exception as e:
                logger.error(f"Failed to create engine for {model.name}: {str(e)}")
                raise
        
        return self.engine_cache[cache_key]
    
    def process_chat_request(self, user: User, message: str, conversation_id: Optional[int] = None,
                           model_id: Optional[int] = None, temperature: float = 0.7,
                           max_tokens: int = 2048, top_p: float = 0.9, 
                           system_prompt: str = "", **kwargs) -> Dict[str, Any]:
        """Process a chat request and return response"""
        
        # Get or create conversation
        if conversation_id:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        else:
            # Get model
            if model_id:
                model = LLMModel.objects.get(id=model_id)
            else:
                # Use user's default model
                preferences = UserPreference.objects.get_or_create(user=user)[0]
                model = preferences.default_model or LLMModel.objects.filter(is_active=True).first()
            
            if not model:
                raise ValueError("No model available")
            
            # Create new conversation
            conversation = Conversation.objects.create(
                user=user,
                title=message[:50] + "..." if len(message) > 50 else message,
                model=model
            )
        
        # Add user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=message
        )
        
        # Prepare context
        messages = conversation.messages.all()
        context = self._build_context(messages, system_prompt)
        
        # Get model and generate response
        model = conversation.model
        engine = self._get_engine(model)
        
        try:
            response_text = engine.generate(
                prompt=context,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                **kwargs
            )
            
            # Estimate tokens (rough approximation)
            tokens_used = len(response_text.split()) * 1.3
            
            # Add assistant message
            assistant_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_text,
                tokens_used=int(tokens_used)
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return {
                'response': response_text,
                'conversation_id': conversation.id,
                'message_id': assistant_message.id,
                'tokens_used': int(tokens_used),
                'model_used': model.name
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise
    
    def process_stream_chat_request(self, user: User, message: str, conversation_id: Optional[int] = None,
                                  model_id: Optional[int] = None, temperature: float = 0.7,
                                  max_tokens: int = 2048, top_p: float = 0.9,
                                  system_prompt: str = "", **kwargs) -> Generator[str, None, None]:
        """Process a streaming chat request"""
        
        # Get or create conversation
        if conversation_id:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        else:
            # Get model
            if model_id:
                model = LLMModel.objects.get(id=model_id)
            else:
                preferences = UserPreference.objects.get_or_create(user=user)[0]
                model = preferences.default_model or LLMModel.objects.filter(is_active=True).first()
            
            if not model:
                raise ValueError("No model available")
            
            # Create new conversation
            conversation = Conversation.objects.create(
                user=user,
                title=message[:50] + "..." if len(message) > 50 else message,
                model=model
            )
        
        # Add user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=message
        )
        
        # Prepare context
        messages = conversation.messages.all()
        context = self._build_context(messages, system_prompt)
        
        # Get model and generate streaming response
        model = conversation.model
        engine = self._get_engine(model)
        
        try:
            full_response = ""
            for chunk in engine.stream_generate(
                prompt=context,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                **kwargs
            ):
                full_response += chunk
                yield json.dumps({
                    'chunk': chunk,
                    'conversation_id': conversation.id,
                    'model_used': model.name
                })
            
            # Save complete response
            tokens_used = len(full_response.split()) * 1.3
            assistant_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=full_response,
                tokens_used=int(tokens_used)
            )
            
            # Update conversation timestamp
            conversation.save()
            
            # Send final message
            yield json.dumps({
                'done': True,
                'message_id': assistant_message.id,
                'tokens_used': int(tokens_used)
            })
            
        except Exception as e:
            logger.error(f"Error in stream generation: {str(e)}")
            yield json.dumps({'error': str(e)})
    
    def test_model(self, model: LLMModel, prompt: str, temperature: float = 0.7,
                  max_tokens: int = 100) -> str:
        """Test a model with a simple prompt"""
        engine = self._get_engine(model)
        return engine.generate(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    def _build_context(self, messages: List[Message], system_prompt: str = "") -> str:
        """Build context from conversation messages"""
        context_parts = []
        
        if system_prompt:
            context_parts.append(f"System: {system_prompt}")
        
        for message in messages:
            role = message.role.capitalize()
            context_parts.append(f"{role}: {message.content}")
        
        return "\n\n".join(context_parts)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models with their info"""
        models = LLMModel.objects.filter(is_active=True)
        model_info = []
        
        for model in models:
            try:
                engine = self._get_engine(model)
                info = engine.get_model_info()
                info['id'] = model.id
                info['name'] = model.name
                info['description'] = model.description
                model_info.append(info)
            except Exception as e:
                logger.error(f"Failed to get info for model {model.name}: {str(e)}")
                model_info.append({
                    'id': model.id,
                    'name': model.name,
                    'description': model.description,
                    'error': str(e)
                })
        
        return model_info
    
    def clear_engine_cache(self):
        """Clear the engine cache"""
        self.engine_cache.clear()
        logger.info("Engine cache cleared")
