"""
Recipe-related API routes
"""
from fastapi import APIRouter, HTTPException, Form
from typing import Optional, List

from ..models import Recipe, RecipeCreate
from ..database import db
from ..services import ai_service
from ..logger import get_logger, log_request, log_error, log_user_action
from ..utils import format_success_response, format_error_response

router = APIRouter(prefix="/recipes", tags=["recipes"])
logger = get_logger("recipes")

@router.post("/", response_model=dict)
async def create_recipe(recipe_data: RecipeCreate, user_id: str = Form(...)):
    """Create a new recipe with AI-powered quick version conversion"""
    try:
        log_request("POST", "/api/recipes", user_id=user_id, recipe_name=recipe_data.name)
        
        # Convert recipe using AI
        conversion_data = await ai_service.convert_recipe_to_quick_version(
            recipe_data.original_recipe, 
            recipe_data.cuisine_type
        )
        
        # Create recipe object
        recipe = Recipe(
            user_id=user_id,
            name=recipe_data.name,
            description=recipe_data.description,
            cuisine_type=recipe_data.cuisine_type,
            category=recipe_data.category,
            original_recipe=recipe_data.original_recipe,
            servings=recipe_data.servings,
            tags=recipe_data.tags,
            **conversion_data
        )
        
        # Save to database
        recipe_dict = recipe.dict()
        await db.insert_document("recipes", recipe_dict)
        
        log_user_action(user_id, "CREATE", "recipe", recipe_name=recipe_data.name)
        logger.info(f"Recipe created successfully: {recipe_data.name}")
        
        return format_success_response(recipe_dict, "Recipe created successfully")
        
    except Exception as e:
        log_error(e, "Failed to create recipe", user_id=user_id, recipe_name=recipe_data.name)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=dict)
async def get_recipes(user_id: Optional[str] = None, category: Optional[str] = None, 
                     cuisine_type: Optional[str] = None, limit: int = 50):
    """Get recipes with optional filtering"""
    try:
        log_request("GET", "/api/recipes", user_id=user_id, category=category, limit=limit)
        
        # Build filter
        filter_dict = {}
        if user_id:
            filter_dict["user_id"] = user_id
        if category:
            filter_dict["category"] = category
        if cuisine_type:
            filter_dict["cuisine_type"] = cuisine_type
        
        # Fetch recipes
        recipes = await db.find_documents("recipes", filter_dict, sort_by="created_at", limit=limit)
        
        logger.info(f"Retrieved {len(recipes)} recipes")
        return format_success_response(recipes, f"Retrieved {len(recipes)} recipes")
        
    except Exception as e:
        log_error(e, "Failed to get recipes", user_id=user_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{recipe_id}", response_model=dict)
async def get_recipe(recipe_id: str):
    """Get a specific recipe by ID"""
    try:
        log_request("GET", f"/api/recipes/{recipe_id}")
        
        recipe = await db.find_document("recipes", {"id": recipe_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        logger.info(f"Retrieved recipe: {recipe_id}")
        return format_success_response(recipe, "Recipe retrieved successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "Failed to get recipe", recipe_id=recipe_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{recipe_id}/favorite", response_model=dict)
async def toggle_recipe_favorite(recipe_id: str, user_id: str = Form(...)):
    """Toggle recipe favorite status"""
    try:
        log_request("PUT", f"/api/recipes/{recipe_id}/favorite", user_id=user_id)
        
        # Find recipe
        recipe = await db.find_document("recipes", {"id": recipe_id, "user_id": user_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Toggle favorite status
        new_favorite_status = not recipe.get("is_favorite", False)
        await db.update_document(
            "recipes", 
            {"id": recipe_id}, 
            {"is_favorite": new_favorite_status}
        )
        
        log_user_action(user_id, "UPDATE_FAVORITE", "recipe", 
                       recipe_id=recipe_id, is_favorite=new_favorite_status)
        
        logger.info(f"Recipe favorite status updated: {recipe_id} -> {new_favorite_status}")
        return format_success_response(
            {"is_favorite": new_favorite_status}, 
            f"Recipe {'added to' if new_favorite_status else 'removed from'} favorites"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "Failed to toggle recipe favorite", recipe_id=recipe_id, user_id=user_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{recipe_id}", response_model=dict)
async def delete_recipe(recipe_id: str, user_id: str = Form(...)):
    """Delete a recipe"""
    try:
        log_request("DELETE", f"/api/recipes/{recipe_id}", user_id=user_id)
        
        # Verify recipe ownership
        recipe = await db.find_document("recipes", {"id": recipe_id, "user_id": user_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Delete recipe
        deleted = await db.delete_document("recipes", {"id": recipe_id})
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete recipe")
        
        log_user_action(user_id, "DELETE", "recipe", recipe_id=recipe_id)
        logger.info(f"Recipe deleted: {recipe_id}")
        
        return format_success_response(None, "Recipe deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "Failed to delete recipe", recipe_id=recipe_id, user_id=user_id)
        raise HTTPException(status_code=500, detail=str(e))