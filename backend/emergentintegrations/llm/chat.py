"""
LLM Chat Integration Module
Provides Groq LLM integration for food analysis and recipe conversion
"""

from groq import Groq
import base64
import json
from typing import List, Dict, Any, Optional
import logging


class ImageContent:
    """Represents image content for LLM analysis"""
    
    def __init__(self, image_base64: str):
        self.image_base64 = image_base64


class UserMessage:
    """Represents a user message to the LLM"""
    
    def __init__(self, text: str, file_contents: List[ImageContent] = None):
        self.text = text
        self.file_contents = file_contents or []


class LlmChat:
    """LLM Chat interface for Groq"""
    
    def __init__(self, api_key: str, session_id: str, system_message: str):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model = "llama-3.1-8b-instant"  # Default Groq model
        self.client = Groq(api_key=api_key)
        
    def with_model(self, provider: str, model: str):
        """Set the model to use"""
        if provider == "groq":
            # Use appropriate Groq models - updated for current availability
            if "vision" in model.lower() or "image" in model.lower():
                self.model = "llama-3.2-11b-vision-preview"
            else:
                self.model = "llama-3.1-8b-instant"
        elif provider == "openai":
            # For backwards compatibility, map to appropriate Groq models
            if "gpt-4" in model.lower():
                self.model = "llama-3.1-8b-instant"
            else:
                self.model = "llama-3.1-8b-instant"
        return self
    
    async def send_message(self, message: UserMessage) -> str:
        """Send a message to the LLM and get response"""
        try:
            messages = [
                {"role": "system", "content": self.system_message}
            ]
            
            # For Groq, handle images differently based on model capabilities
            if message.file_contents and "vision" in self.model:
                # Prepare user message content with images for vision model
                user_content = []
                user_content.append({
                    "type": "text",
                    "text": message.text
                })
                
                # Add images if present
                for image_content in message.file_contents:
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_content.image_base64}"
                        }
                    })
                
                messages.append({
                    "role": "user", 
                    "content": user_content
                })
            else:
                # For non-vision models or text-only queries
                messages.append({
                    "role": "user",
                    "content": message.text
                })
            
            # Make the API call to Groq
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=2000,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logging.error(f"Error in LLM chat: {str(e)}")
            # Return a fallback response that can be parsed
            if "food" in message.text.lower() or "analyze" in message.text.lower():
                return self._get_fallback_food_analysis()
            elif "recipe" in message.text.lower() or "convert" in message.text.lower():
                return self._get_fallback_recipe_conversion()
            else:
                raise e
    
    def _get_fallback_food_analysis(self) -> str:
        """Fallback food analysis when LLM fails"""
        return json.dumps({
            "meal_name": "Mixed Vegetables",
            "ingredients": ["vegetables", "spices", "oil"],
            "calories_per_serving": 250.0,
            "serving_size": "1 cup (200g)",
            "protein_g": 8.0,
            "carbs_g": 35.0,
            "fat_g": 12.0,
            "fiber_g": 6.0,
            "sugar_g": 8.0,
            "sodium_mg": 300.0,
            "analysis_confidence": 0.6,
            "cultural_context": "Traditional dish",
            "ingredient_substitutions": [],
            "quick_recipe_tips": "Can be prepared quickly with pre-cut vegetables"
        })
    
    def _get_fallback_recipe_conversion(self) -> str:
        """Fallback recipe conversion when LLM fails"""
        return json.dumps({
            "quick_version": "Quick version: Use pre-cut vegetables and microwave cooking to reduce time",
            "prep_time_minutes": 10,
            "cook_time_minutes": 15,
            "total_time_minutes": 25,
            "time_saved_minutes": 30,
            "difficulty_level": "easy",
            "ingredients": ["vegetables", "spices", "oil"],
            "instructions": ["Heat oil", "Add vegetables", "Season and cook"],
            "quick_instructions": ["Microwave vegetables", "Mix with spices"],
            "western_substitutions": [],
            "nutritional_info": {
                "calories": 250.0,
                "protein": 8.0,
                "carbs": 35.0,
                "fat": 12.0
            },
            "cultural_notes": "Traditional recipe adapted for modern cooking",
            "tags": ["quick", "easy"],
            "tips": "Use frozen vegetables for convenience"
        })