"""
AI Copilot-related API routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from ..models import (CopilotChatMessage, CopilotResponse, RecipeSuggestionRequest, 
                     CookingGuidanceRequest)
from ..services import ai_service
from ..logger import get_logger, log_request, log_error, log_performance
from ..utils import format_success_response
import time

router = APIRouter(prefix="/copilot", tags=["copilot"])
logger = get_logger("copilot")

@router.post("/chat", response_model=dict)
async def chat_with_copilot(message_data: CopilotChatMessage):
    """General chat with AI cooking assistant"""
    try:
        start_time = time.time()
        log_request("POST", "/api/copilot/chat", message_length=len(message_data.message))
        
        # For now, we'll use the cooking guidance function for general chat
        # In a real implementation, you might want a separate chat endpoint
        response = await ai_service.get_cooking_guidance(
            recipe_name="general_cooking_chat",
            question=message_data.message
        )
        
        processing_time = (time.time() - start_time) * 1000
        log_performance("copilot_chat", processing_time)
        
        chat_response = CopilotResponse(
            response=response.get("guidance", "I'm here to help with your cooking questions!"),
            context=message_data.context
        )
        
        logger.info("Copilot chat response generated successfully")
        return format_success_response(chat_response.dict(), "Chat response generated")
        
    except Exception as e:
        log_error(e, "Failed to process copilot chat")
        raise HTTPException(status_code=500, detail="Failed to process chat request")

@router.post("/recipe-suggestions", response_model=dict)
async def get_recipe_suggestions(request: RecipeSuggestionRequest):
    """Get recipe suggestions based on available ingredients"""
    try:
        start_time = time.time()
        log_request("POST", "/api/copilot/recipe-suggestions", 
                   ingredient_count=len(request.available_ingredients))
        
        suggestions = await ai_service.get_recipe_suggestions(
            available_ingredients=request.available_ingredients,
            cuisine_preference=request.cuisine_preference,
            dietary_restrictions=request.dietary_restrictions,
            cooking_time_limit=request.cooking_time_limit
        )
        
        processing_time = (time.time() - start_time) * 1000
        log_performance("recipe_suggestions", processing_time)
        
        logger.info(f"Generated {len(suggestions.get('suggestions', []))} recipe suggestions")
        return format_success_response(suggestions, "Recipe suggestions generated")
        
    except Exception as e:
        log_error(e, "Failed to get recipe suggestions", 
                 ingredients=request.available_ingredients)
        raise HTTPException(status_code=500, detail="Failed to get recipe suggestions")

@router.post("/cooking-guidance", response_model=dict)
async def get_cooking_guidance(request: CookingGuidanceRequest):
    """Get step-by-step cooking guidance for a recipe"""
    try:
        start_time = time.time()
        log_request("POST", "/api/copilot/cooking-guidance", 
                   recipe_name=request.recipe_name, step=request.step_number)
        
        guidance = await ai_service.get_cooking_guidance(
            recipe_name=request.recipe_name,
            step_number=request.step_number,
            question=request.question
        )
        
        processing_time = (time.time() - start_time) * 1000
        log_performance("cooking_guidance", processing_time)
        
        logger.info(f"Cooking guidance provided for: {request.recipe_name}")
        return format_success_response(guidance, "Cooking guidance provided")
        
    except Exception as e:
        log_error(e, "Failed to get cooking guidance", recipe_name=request.recipe_name)
        raise HTTPException(status_code=500, detail="Failed to get cooking guidance")