import json
import requests
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from sentence_transformers import SentenceTransformer
from typing import Dict, List, Optional, Generator, Any
import logging
import ollama
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class LLMEngine(ABC):
    """Abstract base class for LLM engines"""
    
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        pass
    
    @abstractmethod
    def stream_generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        pass


class HuggingFaceEngine(LLMEngine):
    """Hugging Face Transformers engine"""
    
    def __init__(self, model_id: str, device: str = "auto"):
        self.model_id = model_id
        self.device = device
        self.tokenizer = None
        self.model = None
        self.pipeline = None
        self._load_model()
    
    def _load_model(self):
        try:
            logger.info(f"Loading Hugging Face model: {self.model_id}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map=self.device
            )
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device_map=self.device
            )
            logger.info(f"Successfully loaded model: {self.model_id}")
        except Exception as e:
            logger.error(f"Failed to load model {self.model_id}: {str(e)}")
            raise
    
    def generate(self, prompt: str, max_length: int = 512, temperature: float = 0.7, 
                top_p: float = 0.9, **kwargs) -> str:
        try:
            inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    **kwargs
                )
            
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return generated_text[len(prompt):].strip()
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            raise
    
    def stream_generate(self, prompt: str, max_length: int = 512, temperature: float = 0.7,
                       top_p: float = 0.9, **kwargs) -> Generator[str, None, None]:
        try:
            inputs = self.tokenizer.encode(prompt, return_tensors="pt")
            
            with torch.no_grad():
                for _ in range(max_length):
                    outputs = self.model.generate(
                        inputs,
                        max_length=inputs.shape[1] + 1,
                        temperature=temperature,
                        top_p=top_p,
                        do_sample=True,
                        pad_token_id=self.tokenizer.eos_token_id,
                        **kwargs
                    )
                    
                    new_token = outputs[0][-1].item()
                    if new_token == self.tokenizer.eos_token_id:
                        break
                    
                    token_text = self.tokenizer.decode([new_token], skip_special_tokens=True)
                    yield token_text
                    
                    inputs = outputs
        except Exception as e:
            logger.error(f"Error in stream generation: {str(e)}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_id": self.model_id,
            "type": "huggingface",
            "device": self.device,
            "max_length": self.model.config.max_position_embeddings if hasattr(self.model.config, 'max_position_embeddings') else None
        }


class OllamaEngine(LLMEngine):
    """Ollama engine for local models"""
    
    def __init__(self, model_name: str, base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
        self.client = ollama.Client(host=base_url)
    
    def generate(self, prompt: str, temperature: float = 0.7, top_p: float = 0.9,
                max_tokens: int = 2048, **kwargs) -> str:
        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': temperature,
                    'top_p': top_p,
                    'num_predict': max_tokens,
                    **kwargs
                }
            )
            return response['response']
        except Exception as e:
            logger.error(f"Error generating with Ollama: {str(e)}")
            raise
    
    def stream_generate(self, prompt: str, temperature: float = 0.7, top_p: float = 0.9,
                       max_tokens: int = 2048, **kwargs) -> Generator[str, None, None]:
        try:
            stream = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=True,
                options={
                    'temperature': temperature,
                    'top_p': top_p,
                    'num_predict': max_tokens,
                    **kwargs
                }
            )
            
            for chunk in stream:
                if 'response' in chunk:
                    yield chunk['response']
        except Exception as e:
            logger.error(f"Error in Ollama stream generation: {str(e)}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        try:
            models = self.client.list()
            model_info = next((m for m in models['models'] if m['name'] == self.model_name), None)
            return {
                "model_name": self.model_name,
                "type": "ollama",
                "base_url": self.base_url,
                "size": model_info.get('size', 0) if model_info else 0,
                "modified_at": model_info.get('modified_at') if model_info else None
            }
        except Exception as e:
            logger.error(f"Error getting Ollama model info: {str(e)}")
            return {
                "model_name": self.model_name,
                "type": "ollama",
                "base_url": self.base_url,
                "error": str(e)
            }


class CustomAPIEngine(LLMEngine):
    """Custom API engine for external services"""
    
    def __init__(self, api_url: str, api_key: str = None, headers: Dict = None):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = headers or {}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048,
                **kwargs) -> str:
        try:
            payload = {
                'prompt': prompt,
                'temperature': temperature,
                'max_tokens': max_tokens,
                **kwargs
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get('response', data.get('text', ''))
        except Exception as e:
            logger.error(f"Error with custom API: {str(e)}")
            raise
    
    def stream_generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048,
                       **kwargs) -> Generator[str, None, None]:
        try:
            payload = {
                'prompt': prompt,
                'temperature': temperature,
                'max_tokens': max_tokens,
                'stream': True,
                **kwargs
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers=self.headers,
                stream=True,
                timeout=30
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode('utf-8'))
                        if 'response' in data:
                            yield data['response']
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error(f"Error in custom API stream: {str(e)}")
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        return {
            "api_url": self.api_url,
            "type": "custom_api",
            "has_api_key": bool(self.api_key)
        }


class LLMEngineFactory:
    """Factory class for creating LLM engines"""
    
    @staticmethod
    def create_engine(model_type: str, **kwargs) -> LLMEngine:
        if model_type == 'huggingface':
            return HuggingFaceEngine(**kwargs)
        elif model_type == 'ollama':
            return OllamaEngine(**kwargs)
        elif model_type == 'custom':
            return CustomAPIEngine(**kwargs)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")


class EmbeddingEngine:
    """Engine for generating embeddings"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Successfully loaded embedding model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model {self.model_name}: {str(e)}")
            raise
    
    def encode(self, texts: List[str]) -> List[List[float]]:
        try:
            embeddings = self.model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error encoding texts: {str(e)}")
            raise
    
    def encode_single(self, text: str) -> List[float]:
        return self.encode([text])[0]
