from django.core.management.base import BaseCommand
from llm_service.models import LLMModel


class Command(BaseCommand):
    help = 'Setup default LLM models'
    
    def handle(self, *args, **options):
        # Create default models
        models_data = [
            {
                'name': 'GPT-2 Small',
                'model_type': 'huggingface',
                'model_id': 'gpt2',
                'description': 'Small GPT-2 model for text generation',
                'max_tokens': 1024,
                'temperature': 0.7,
                'top_p': 0.9,
                'config': {'device': 'auto'}
            },
            {
                'name': 'GPT-2 Medium',
                'model_type': 'huggingface',
                'model_id': 'gpt2-medium',
                'description': 'Medium GPT-2 model for better text generation',
                'max_tokens': 1024,
                'temperature': 0.7,
                'top_p': 0.9,
                'config': {'device': 'auto'}
            },
            {
                'name': 'Llama 2 7B (Ollama)',
                'model_type': 'ollama',
                'model_id': 'llama2:7b',
                'description': 'Llama 2 7B model via Ollama',
                'max_tokens': 2048,
                'temperature': 0.7,
                'top_p': 0.9,
                'config': {'base_url': 'http://localhost:11434'}
            },
            {
                'name': 'Code Llama (Ollama)',
                'model_type': 'ollama',
                'model_id': 'codellama:7b',
                'description': 'Code Llama model for code generation',
                'max_tokens': 2048,
                'temperature': 0.3,
                'top_p': 0.9,
                'config': {'base_url': 'http://localhost:11434'}
            }
        ]
        
        for model_data in models_data:
            model, created = LLMModel.objects.get_or_create(
                name=model_data['name'],
                defaults=model_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created model: {model.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Model already exists: {model.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup default models')
        )