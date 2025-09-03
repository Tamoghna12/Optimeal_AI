"""
AI and external service integrations for the Homeland Meals API
"""
import logging
import json
import uuid
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from .config import EMERGENT_LLM_KEY, GROQ_API_KEY
from .utils import sanitize_recipe_data

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-powered features using LLM integrations"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY or GROQ_API_KEY
        if not self.api_key:
            logger.warning("No LLM API key configured - AI features will be disabled")
    
    async def convert_recipe_to_quick_version(self, recipe_text: str, cuisine_type: str = "South Asian") -> Dict[str, Any]:
        """
        Convert traditional recipe to quick version using LLM
        
        Args:
            recipe_text: Original recipe text
            cuisine_type: Type of cuisine (default: South Asian)
        
        Returns:
            Dictionary with quick recipe conversion data
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        try:
            # Sanitize input
            recipe_text = sanitize_recipe_data(recipe_text)
            
            logger.info(f"Converting {cuisine_type} recipe to quick version")
            
            # Create LLM chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"recipe-conversion-{uuid.uuid4()}",
                system_message=self._get_recipe_conversion_prompt(cuisine_type)
            ).with_model("groq", "llama-3.1-8b-instant")
            
            # Create user message
            user_message = UserMessage(
                text=f"Convert this traditional {cuisine_type} recipe into a quick, student-friendly version while maintaining authentic flavors:\n\n{recipe_text}\n\nFocus on time-saving techniques, ingredient substitutions available in Western grocery stores, and simplifying the cooking process."
            )
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            # Parse and return response
            return self._parse_recipe_response(str(response))
            
        except Exception as e:
            logger.error(f"Error converting recipe: {str(e)}", exc_info=True)
            return self._get_fallback_recipe_conversion()
    
    async def analyze_food_image(self, image_base64: str) -> Dict[str, Any]:
        """
        Analyze food image for nutritional information
        
        Args:
            image_base64: Base64 encoded image
        
        Returns:
            Dictionary with food analysis data
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        try:
            logger.info("Analyzing food image for nutritional information")
            
            # Create LLM chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"food-analysis-{uuid.uuid4()}",
                system_message=self._get_food_analysis_prompt()
            ).with_model("groq", "llama-3.1-8b-instant")
            
            # Create message with image
            user_message = UserMessage(
                text="Please analyze this food image and provide detailed nutritional information.",
                images=[ImageContent(base64=image_base64, media_type="image/jpeg")]
            )
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            # Parse and return response
            return self._parse_food_analysis_response(str(response))
            
        except Exception as e:
            logger.error(f"Error analyzing food image: {str(e)}", exc_info=True)
            return self._get_fallback_food_analysis()
    
    async def get_cooking_guidance(self, recipe_name: str, step_number: Optional[int] = None, 
                                 question: Optional[str] = None) -> Dict[str, Any]:
        """
        Get cooking guidance for a specific recipe
        
        Args:
            recipe_name: Name of the recipe
            step_number: Optional step number for specific guidance
            question: Optional specific question about cooking
        
        Returns:
            Dictionary with cooking guidance
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        try:
            logger.info(f"Providing cooking guidance for: {recipe_name}")
            
            # Create LLM chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"cooking-guidance-{uuid.uuid4()}",
                system_message=self._get_cooking_guidance_prompt()
            ).with_model("groq", "llama-3.1-8b-instant")
            
            # Create user message
            query_parts = [f"I need cooking guidance for {recipe_name}"]
            if step_number:
                query_parts.append(f"Specifically for step {step_number}")
            if question:
                query_parts.append(f"My question is: {question}")
            
            user_message = UserMessage(text=". ".join(query_parts))
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return {
                "guidance": str(response),
                "recipe_name": recipe_name,
                "step_number": step_number,
                "question": question
            }
            
        except Exception as e:
            logger.error(f"Error getting cooking guidance: {str(e)}", exc_info=True)
            return {
                "guidance": "Sorry, I'm unable to provide cooking guidance at the moment. Please try again later.",
                "recipe_name": recipe_name,
                "error": True
            }
    
    async def get_recipe_suggestions(self, available_ingredients: List[str], 
                                   cuisine_preference: Optional[str] = None,
                                   dietary_restrictions: Optional[List[str]] = None,
                                   cooking_time_limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Get recipe suggestions based on available ingredients and preferences
        
        Args:
            available_ingredients: List of available ingredients
            cuisine_preference: Preferred cuisine type
            dietary_restrictions: List of dietary restrictions
            cooking_time_limit: Maximum cooking time in minutes
        
Returns:
            Dictionary with recipe suggestions
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        try:
            logger.info(f"Getting recipe suggestions for {len(available_ingredients)} ingredients")
            
            # Create LLM chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"recipe-suggestions-{uuid.uuid4()}",
                system_message=self._get_recipe_suggestions_prompt()
            ).with_model("groq", "llama-3.1-8b-instant")
            
            # Build query
            query_parts = [f"Available ingredients: {', '.join(available_ingredients)}"]
            
            if cuisine_preference:
                query_parts.append(f"Preferred cuisine: {cuisine_preference}")
            if dietary_restrictions:
                query_parts.append(f"Dietary restrictions: {', '.join(dietary_restrictions)}")
            if cooking_time_limit:
                query_parts.append(f"Maximum cooking time: {cooking_time_limit} minutes")
            
            user_message = UserMessage(text=". ".join(query_parts))
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return self._parse_recipe_suggestions_response(str(response))
            
        except Exception as e:
            logger.error(f"Error getting recipe suggestions: {str(e)}", exc_info=True)
            return {
                "suggestions": ["Sorry, I'm unable to provide recipe suggestions at the moment."],
                "error": True
            }
    
    def _get_recipe_conversion_prompt(self, cuisine_type: str) -> str:
        """Get system prompt for recipe conversion"""
        return f"""You are a culinary expert specializing in {cuisine_type} cuisine with deep knowledge of both traditional cooking methods and modern time-saving techniques. Your expertise includes ingredient substitutions available in Western grocery stores and quick cooking methods suitable for busy students and working professionals.

Convert traditional recipes into practical, time-efficient versions while maintaining authentic flavors. Focus on:
1. Reducing cooking time through modern techniques
2. Simplifying preparation steps
3. Suggesting readily available ingredient substitutions
4. Maintaining cultural authenticity and taste
5. Making recipes student/busy-professional friendly

Return your response as a JSON object with this exact structure:
{{
    "quick_version": "Detailed quick recipe instructions",
    "prep_time_minutes": 15,
    "cook_time_minutes": 20,
    "total_time_minutes": 35,
    "time_saved_minutes": 45,
    "difficulty_level": "easy",
    "ingredients": ["ingredient1", "ingredient2"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "quick_instructions": ["Quick Step 1", "Quick Step 2"],
    "western_substitutions": [
        {{
            "original": "traditional ingredient",
            "substitute": "western alternative",
            "notes": "where to find and how to use"
        }}
    ],
    "nutritional_info": {{
        "calories": 350.0,
        "protein": 15.0,
        "carbs": 45.0,
        "fat": 12.0
    }},
    "cultural_notes": "Background about the dish and cultural significance",
    "tags": ["vegetarian", "quick", "student-friendly"],
    "tips": "Additional cooking tips and variations"
}}"""
    
    def _get_food_analysis_prompt(self) -> str:
        """Get system prompt for food analysis"""
        return """You are a nutrition expert specializing in South Asian cuisine. Analyze food images and provide detailed nutritional breakdowns. 

Return your response as a JSON object with this exact structure:
{
    "meal_name": "Name of the dish",
    "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
    "calories_per_serving": 450.0,
    "serving_size": "1 cup (250g)",
    "protein_g": 15.2,
    "carbs_g": 65.3,
    "fat_g": 12.1,
    "fiber_g": 8.4,
    "sugar_g": 5.2,
    "sodium_mg": 380.5,
    "analysis_confidence": 0.85,
    "cultural_context": "Traditional South Asian dish",
    "ingredient_substitutions": [
        {
            "original": "traditional ingredient",
            "western_substitute": "available alternative",
            "notes": "substitution notes"
        }
    ],
    "health_notes": "Health benefits and nutritional highlights"
}"""
    
    def _get_cooking_guidance_prompt(self) -> str:
        """Get system prompt for cooking guidance"""
        return """You are an expert South Asian chef with decades of experience teaching cooking to students and busy professionals. Provide clear, practical cooking guidance that helps users succeed in their kitchen. Focus on:
1. Clear, step-by-step instructions
2. Common mistakes to avoid
3. Visual and sensory cues to look for
4. Tips for ingredient substitutions
5. Troubleshooting common issues
6. Time-saving techniques

Always be encouraging and provide practical solutions."""
    
    def _get_recipe_suggestions_prompt(self) -> str:
        """Get system prompt for recipe suggestions"""
        return """You are a South Asian cuisine expert who helps people create delicious meals with available ingredients. Suggest practical recipes that can be made with the given ingredients, considering dietary restrictions and time constraints.

Return your response as a JSON object with this structure:
{
    "suggestions": [
        {
            "recipe_name": "Recipe Name",
            "description": "Brief description",
            "cooking_time": 30,
            "difficulty": "easy",
            "main_ingredients": ["ingredient1", "ingredient2"],
            "cuisine_type": "North Indian"
        }
    ],
    "tips": "Additional cooking tips and ingredient notes"
}"""
    
    def _parse_recipe_response(self, response_text: str) -> Dict[str, Any]:
        """Parse recipe conversion response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            conversion_data = json.loads(response_text)
            logger.debug("Successfully parsed recipe conversion response")
            return conversion_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse recipe response: {str(e)}")
            return self._get_fallback_recipe_conversion()
    
    def _parse_food_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse food analysis response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            analysis_data = json.loads(response_text)
            logger.debug("Successfully parsed food analysis response")
            return analysis_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse food analysis response: {str(e)}")
            return self._get_fallback_food_analysis()
    
    def _parse_recipe_suggestions_response(self, response_text: str) -> Dict[str, Any]:
        """Parse recipe suggestions response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            suggestions_data = json.loads(response_text)
            logger.debug("Successfully parsed recipe suggestions response")
            return suggestions_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse recipe suggestions response: {str(e)}")
            return {
                "suggestions": ["Unable to parse recipe suggestions. Please try again."],
                "tips": "Please try with different ingredients or preferences.",
                "error": True
            }
    
    def _get_fallback_recipe_conversion(self) -> Dict[str, Any]:
        """Get fallback data when recipe conversion fails"""
        return {
            "quick_version": "Quick version conversion temporarily unavailable, but recipe can still be saved",
            "prep_time_minutes": 20,
            "cook_time_minutes": 30,
            "total_time_minutes": 50,
            "time_saved_minutes": 30,
            "difficulty_level": "medium",
            "ingredients": ["Conversion failed - please try again"],
            "instructions": ["Recipe conversion temporarily unavailable"],
            "quick_instructions": ["Please retry recipe conversion"],
            "western_substitutions": [],
            "nutritional_info": {"calories": 300.0, "protein": 10.0, "carbs": 40.0, "fat": 8.0},
            "cultural_notes": "Recipe conversion temporarily unavailable",
            "tags": ["needs-retry"],
            "tips": "Please try converting this recipe again"
        }
    
    def _get_fallback_food_analysis(self) -> Dict[str, Any]:
        """Get fallback data when food analysis fails"""
        return {
            "meal_name": "Unknown Dish",
            "ingredients": ["Unable to identify"],
            "calories_per_serving": 350.0,
            "serving_size": "1 portion",
            "protein_g": 10.0,
            "carbs_g": 45.0,
            "fat_g": 12.0,
            "fiber_g": 5.0,
            "sugar_g": 8.0,
            "sodium_mg": 400.0,
            "analysis_confidence": 0.3,
            "cultural_context": "Analysis temporarily unavailable",
            "ingredient_substitutions": [],
            "health_notes": "Please try uploading a clearer image for better analysis"
        }

# Global AI service instance
ai_service = AIService()