from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
import base64
import json
from io import BytesIO
from PIL import Image
import asyncio

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    gender: str  # "male" or "female"
    height_cm: float
    weight_kg: float
    activity_level: str  # "sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"
    goal: str  # "lose_weight", "maintain_weight", "gain_weight"
    goal_weight_kg: Optional[float] = None
    daily_calorie_target: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    name: str
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    activity_level: str
    goal: str
    goal_weight_kg: Optional[float] = None

class FoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meal_name: str
    ingredients: List[str]
    calories_per_serving: float
    serving_size: str
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    analysis_confidence: float
    image_base64: Optional[str] = None
    meal_type: str  # "breakfast", "lunch", "dinner", "snack"
    date_consumed: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    activity_name: str
    duration_minutes: int
    calories_burned: float
    intensity: str  # "low", "moderate", "high"
    date_logged: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    total_calories_consumed: float
    total_calories_burned: float
    net_calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    water_glasses: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IngredientSubstitution(BaseModel):
    original_ingredient: str
    western_substitute: str
    confidence: float
    usage_notes: str

class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: str
    cuisine_type: str  # "South Asian", "Indian", "Pakistani", "Bangladeshi", etc.
    original_recipe: str
    quick_version: str
    prep_time_minutes: int
    cook_time_minutes: int
    total_time_minutes: int
    difficulty_level: str  # "easy", "medium", "hard"
    servings: int
    ingredients: List[str]
    instructions: List[str]
    quick_instructions: List[str]
    nutritional_info: Dict[str, float]  # calories, protein, carbs, fat per serving
    tags: List[str]  # "vegetarian", "vegan", "gluten-free", etc.
    western_substitutions: List[Dict[str, str]]
    cultural_notes: str
    time_saved_minutes: int
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RecipeCreate(BaseModel):
    name: str
    description: str
    cuisine_type: str
    original_recipe: str
    servings: int = 4
    tags: List[str] = []

class RecipeConversion(BaseModel):
    original_recipe: str
    quick_version: str
    time_saved_minutes: int
    difficulty_level: str

class RecipeAnalyzerRequest(BaseModel):
    recipe: str

class RecipeAnalyzerResponse(BaseModel):
    nutrition: Dict[str, Any]
    macros: Dict[str, int]
    health: Dict[str, Any]
    modifications: List[Dict[str, str]]
    budget: Dict[str, Any]

class EmailSignupRequest(BaseModel):
    email: str
    name: Optional[str] = None
    healthUpdates: bool = False
    source: str = "landing_page"
    timestamp: str

class EmailSubscriber(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: Optional[str] = None
    health_updates: bool = False
    source: str = "landing_page"
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed: bool = False
    active: bool = True

# Helper Functions
def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return bmr

def calculate_daily_calories(bmr: float, activity_level: str, goal: str) -> float:
    """Calculate daily calorie target based on activity level and goal"""
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extremely_active": 1.9
    }
    
    maintenance_calories = bmr * activity_multipliers.get(activity_level, 1.2)
    
    if goal == "lose_weight":
        return maintenance_calories - 500  # 1 lb per week
    elif goal == "gain_weight":
        return maintenance_calories + 500
    else:
        return maintenance_calories

async def convert_recipe_with_ai(recipe_text: str, cuisine_type: str = "South Asian") -> Dict[str, Any]:
    """Convert traditional recipe to quick version using LLM"""
    try:
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        # Create LLM chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-conversion-{uuid.uuid4()}",
            system_message=f"""You are a culinary expert specializing in {cuisine_type} cuisine with deep knowledge of both traditional cooking methods and modern time-saving techniques. Your expertise includes ingredient substitutions available in Western grocery stores and quick cooking methods suitable for busy students and working professionals.

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
}}
"""
        ).with_model("openai", "gpt-4o")
        
        # Create message for recipe conversion
        user_message = UserMessage(
            text=f"Convert this traditional {cuisine_type} recipe into a quick, student-friendly version while maintaining authentic flavors:\n\n{recipe_text}\n\nFocus on time-saving techniques, ingredient substitutions available in Western grocery stores, and simplifying the cooking process."
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            response_text = str(response).strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            conversion_data = json.loads(response_text)
            return conversion_data
        except json.JSONDecodeError:
            # If JSON parsing fails, return basic conversion
            return {
                "quick_version": "Quick version conversion failed, but recipe can still be saved",
                "prep_time_minutes": 20,
                "cook_time_minutes": 30,
                "total_time_minutes": 50,
                "time_saved_minutes": 30,
                "difficulty_level": "medium",
                "ingredients": ["Unable to parse ingredients"],
                "instructions": ["Conversion failed - please try again"],
                "quick_instructions": ["Please retry recipe conversion"],
                "western_substitutions": [],
                "nutritional_info": {"calories": 300.0, "protein": 10.0, "carbs": 40.0, "fat": 8.0},
                "cultural_notes": "Recipe conversion temporarily unavailable",
                "tags": ["needs-retry"],
                "tips": "Please try converting this recipe again"
            }
            
    except Exception as e:
        logging.error(f"Error converting recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to convert recipe: {str(e)}")

async def analyze_food_image(image_base64: str) -> Dict[str, Any]:
    """Analyze food image using LLM"""
    try:
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        # Create LLM chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"food-analysis-{uuid.uuid4()}",
            system_message="""You are a nutrition expert specializing in South Asian cuisine. Analyze food images and provide detailed nutritional breakdowns. 

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
            "original": "garam masala",
            "western_substitute": "allspice + black pepper + cardamom powder",
            "notes": "Available at most Western grocery stores in spice aisle"
        }
    ],
    "quick_recipe_tips": "Can be made in 20 minutes using pre-cooked rice and microwave-steamed vegetables"
}

Focus on accuracy for calories and macronutrients. If unsure about exact values, indicate in analysis_confidence (0.0-1.0).
"""
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create message with image
        user_message = UserMessage(
            text="Analyze this food image and provide detailed nutritional information in the specified JSON format. Pay special attention to South Asian ingredients and suggest Western grocery store substitutions where applicable.",
            file_contents=[image_content]
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Try to extract JSON from response
            response_text = str(response).strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            analysis_data = json.loads(response_text)
            return analysis_data
        except json.JSONDecodeError:
            # If JSON parsing fails, return basic analysis
            return {
                "meal_name": "Unidentified Food",
                "ingredients": ["Unknown ingredients"],
                "calories_per_serving": 300.0,
                "serving_size": "1 serving",
                "protein_g": 10.0,
                "carbs_g": 40.0,
                "fat_g": 8.0,
                "fiber_g": 3.0,
                "sugar_g": 5.0,
                "sodium_mg": 200.0,
                "analysis_confidence": 0.3,
                "cultural_context": "Unable to analyze",
                "ingredient_substitutions": [],
                "quick_recipe_tips": "Could not generate recipe tips"
            }
            
    except Exception as e:
        logging.error(f"Error analyzing food image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze food image: {str(e)}")

# API Routes

@api_router.post("/profile", response_model=UserProfile)
async def create_user_profile(profile_data: UserProfileCreate):
    """Create or update user profile with calculated daily calorie target"""
    try:
        # Calculate BMR and daily calories
        bmr = calculate_bmr(
            profile_data.weight_kg,
            profile_data.height_cm,
            profile_data.age,
            profile_data.gender
        )
        
        daily_calories = calculate_daily_calories(
            bmr,
            profile_data.activity_level,
            profile_data.goal
        )
        
        # Create profile object
        profile_dict = profile_data.dict()
        profile_dict['daily_calorie_target'] = daily_calories
        profile = UserProfile(**profile_dict)
        
        # Save to database
        await db.user_profiles.insert_one(profile.dict())
        
        return profile
    except Exception as e:
        logging.error(f"Error creating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@api_router.get("/profile/{profile_id}", response_model=UserProfile)
async def get_user_profile(profile_id: str):
    """Get user profile by ID"""
    try:
        profile_data = await db.user_profiles.find_one({"id": profile_id})
        if not profile_data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return UserProfile(**profile_data)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@api_router.post("/analyze-food")
async def analyze_food_endpoint(file: UploadFile = File(...), user_id: str = Form(...), meal_type: str = Form("lunch")):
    """Analyze uploaded food image and return nutritional information"""
    try:
        # Read and validate file
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Analyze with LLM
        analysis = await analyze_food_image(image_base64)
        
        # Create food entry
        food_entry = FoodEntry(
            user_id=user_id,
            meal_name=analysis['meal_name'],
            ingredients=analysis['ingredients'],
            calories_per_serving=analysis['calories_per_serving'],
            serving_size=analysis['serving_size'],
            protein_g=analysis['protein_g'],
            carbs_g=analysis['carbs_g'],
            fat_g=analysis['fat_g'],
            fiber_g=analysis['fiber_g'],
            sugar_g=analysis['sugar_g'],
            sodium_mg=analysis['sodium_mg'],
            analysis_confidence=analysis['analysis_confidence'],
            image_base64=image_base64,
            meal_type=meal_type,
            date_consumed=date.today().isoformat()
        )
        
        # Save to database
        await db.food_entries.insert_one(food_entry.dict())
        
        # Return analysis with additional cultural context
        return {
            "food_entry": food_entry,
            "cultural_context": analysis.get('cultural_context', ''),
            "ingredient_substitutions": analysis.get('ingredient_substitutions', []),
            "quick_recipe_tips": analysis.get('quick_recipe_tips', '')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing food: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze food: {str(e)}")

@api_router.get("/food-entries/{user_id}")
async def get_food_entries(user_id: str, date_filter: Optional[str] = None):
    """Get food entries for a user, optionally filtered by date"""
    try:
        query = {"user_id": user_id}
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
                query["date_consumed"] = filter_date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        food_entries = await db.food_entries.find(query).sort("created_at", -1).to_list(100)
        return [FoodEntry(**entry) for entry in food_entries]
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting food entries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get food entries: {str(e)}")

@api_router.post("/workout", response_model=WorkoutEntry)
async def log_workout(
    user_id: str = Form(...),
    activity_name: str = Form(...),
    duration_minutes: int = Form(...),
    intensity: str = Form("moderate")
):
    """Log a workout entry"""
    try:
        # Calculate calories burned (simplified calculation)
        intensity_multipliers = {"low": 3, "moderate": 5, "high": 8}
        calories_burned = duration_minutes * intensity_multipliers.get(intensity, 5)
        
        workout = WorkoutEntry(
            user_id=user_id,
            activity_name=activity_name,
            duration_minutes=duration_minutes,
            calories_burned=calories_burned,
            intensity=intensity,
            date_logged=date.today().isoformat()
        )
        
        await db.workout_entries.insert_one(workout.dict())
        return workout
        
    except Exception as e:
        logging.error(f"Error logging workout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log workout: {str(e)}")

@api_router.get("/daily-stats/{user_id}/{date_str}")
async def get_daily_stats(user_id: str, date_str: str):
    """Get daily nutrition and fitness stats"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Get food entries for the day
        food_entries = await db.food_entries.find({
            "user_id": user_id,
            "date_consumed": target_date.isoformat()
        }).to_list(100)
        
        # Get workout entries for the day
        workout_entries = await db.workout_entries.find({
            "user_id": user_id,
            "date_logged": target_date.isoformat()
        }).to_list(100)
        
        # Calculate totals
        total_calories_consumed = sum(entry['calories_per_serving'] for entry in food_entries)
        total_calories_burned = sum(entry['calories_burned'] for entry in workout_entries)
        total_protein = sum(entry['protein_g'] for entry in food_entries)
        total_carbs = sum(entry['carbs_g'] for entry in food_entries)
        total_fat = sum(entry['fat_g'] for entry in food_entries)
        total_fiber = sum(entry['fiber_g'] for entry in food_entries)
        
        # Get user profile for target calories
        profile = await db.user_profiles.find_one({"id": user_id})
        daily_target = profile['daily_calorie_target'] if profile else 2000
        
        return {
            "date": date_str,
            "calories_consumed": total_calories_consumed,
            "calories_burned": total_calories_burned,
            "net_calories": total_calories_consumed - total_calories_burned,
            "daily_target": daily_target,
            "remaining_calories": daily_target - total_calories_consumed,
            "protein_g": total_protein,
            "carbs_g": total_carbs,
            "fat_g": total_fat,
            "fiber_g": total_fiber,
            "meals_logged": len(food_entries),
            "workouts_logged": len(workout_entries)
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logging.error(f"Error getting daily stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get daily stats: {str(e)}")

@api_router.post("/recipe", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate, user_id: str = Form(...)):
    """Create a new recipe with AI-powered quick conversion"""
    try:
        # Convert traditional recipe to quick version using AI
        conversion_result = await convert_recipe_with_ai(recipe_data.original_recipe, recipe_data.cuisine_type)
        
        # Create recipe object
        recipe = Recipe(
            user_id=user_id,
            name=recipe_data.name,
            description=recipe_data.description,
            cuisine_type=recipe_data.cuisine_type,
            original_recipe=recipe_data.original_recipe,
            quick_version=conversion_result['quick_version'],
            prep_time_minutes=conversion_result['prep_time_minutes'],
            cook_time_minutes=conversion_result['cook_time_minutes'],
            total_time_minutes=conversion_result['total_time_minutes'],
            difficulty_level=conversion_result['difficulty_level'],
            servings=recipe_data.servings,
            ingredients=conversion_result['ingredients'],
            instructions=conversion_result.get('instructions', []),
            quick_instructions=conversion_result['quick_instructions'],
            nutritional_info=conversion_result['nutritional_info'],
            tags=recipe_data.tags + conversion_result.get('tags', []),
            western_substitutions=conversion_result['western_substitutions'],
            cultural_notes=conversion_result['cultural_notes'],
            time_saved_minutes=conversion_result['time_saved_minutes']
        )
        
        # Save to database
        await db.recipes.insert_one(recipe.dict())
        
        return recipe
        
    except Exception as e:
        logging.error(f"Error creating recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create recipe: {str(e)}")

@api_router.get("/recipes/{user_id}")
async def get_user_recipes(user_id: str, cuisine_type: Optional[str] = None, tag: Optional[str] = None):
    """Get recipes for a user with optional filtering"""
    try:
        query = {"user_id": user_id}
        
        if cuisine_type:
            query["cuisine_type"] = cuisine_type
        
        if tag:
            query["tags"] = {"$in": [tag]}
        
        recipes = await db.recipes.find(query).sort("created_at", -1).to_list(100)
        return [Recipe(**recipe) for recipe in recipes]
        
    except Exception as e:
        logging.error(f"Error getting recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recipes: {str(e)}")

@api_router.get("/recipe/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """Get a specific recipe by ID"""
    try:
        recipe_data = await db.recipes.find_one({"id": recipe_id})
        if not recipe_data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return Recipe(**recipe_data)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recipe: {str(e)}")

@api_router.put("/recipe/{recipe_id}/favorite")
async def toggle_recipe_favorite(recipe_id: str):
    """Toggle recipe favorite status"""
    try:
        recipe_data = await db.recipes.find_one({"id": recipe_id})
        if not recipe_data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        new_favorite_status = not recipe_data.get('is_favorite', False)
        
        await db.recipes.update_one(
            {"id": recipe_id},
            {"$set": {"is_favorite": new_favorite_status, "updated_at": datetime.utcnow()}}
        )
        
        return {"id": recipe_id, "is_favorite": new_favorite_status}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error toggling recipe favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite: {str(e)}")

@api_router.post("/recipe/convert")
async def convert_traditional_recipe(recipe_text: str = Form(...), cuisine_type: str = Form("South Asian")):
    """Convert a traditional recipe to quick version without saving"""
    try:
        conversion_result = await convert_recipe_with_ai(recipe_text, cuisine_type)
        return conversion_result
        
    except Exception as e:
        logging.error(f"Error converting recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to convert recipe: {str(e)}")

@api_router.delete("/recipe/{recipe_id}")
async def delete_recipe(recipe_id: str):
    """Delete a recipe"""
    try:
        result = await db.recipes.delete_one({"id": recipe_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {"message": "Recipe deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete recipe: {str(e)}")

@api_router.get("/ingredient-substitutions/{ingredient}")
async def get_ingredient_substitutions(ingredient: str):
    """Get Western grocery store substitutions for South Asian ingredients"""
    # This could be enhanced with LLM calls for dynamic suggestions
    common_substitutions = {
        "garam masala": {
            "substitute": "allspice + black pepper + cardamom powder",
            "notes": "Mix 1 tsp allspice, 1/2 tsp black pepper, 1/2 tsp cardamom powder"
        },
        "curry leaves": {
            "substitute": "bay leaves + lime zest",
            "notes": "Use 2 bay leaves + 1 tsp lime zest for every 10 curry leaves"
        },
        "tamarind paste": {
            "substitute": "lemon juice + brown sugar",
            "notes": "Mix 2 tbsp lemon juice + 1 tbsp brown sugar"
        },
        "jaggery": {
            "substitute": "brown sugar + molasses",
            "notes": "Mix 1 cup brown sugar + 2 tbsp molasses"
        },
        "paneer": {
            "substitute": "ricotta cheese + salt",
            "notes": "Press ricotta overnight and add salt to taste"
        }
    }
    
    ingredient_lower = ingredient.lower()
    if ingredient_lower in common_substitutions:
        return common_substitutions[ingredient_lower]
    else:
        return {
            "substitute": "Not found in database",
            "notes": "Try searching for similar ingredients or visit an Indian grocery store"
        }

# Co-pilot Models
class CopilotQuery(BaseModel):
    query: str
    context: Optional[str] = None
    user_id: Optional[str] = None

class RecipeFromIngredientsRequest(BaseModel):
    available_ingredients: List[str]
    cuisine_preference: str = "South Asian"
    dietary_restrictions: List[str] = []
    cooking_time_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None

class CookingGuidanceRequest(BaseModel):
    recipe_id: Optional[str] = None
    current_step: Optional[str] = None
    question: str
    context: Optional[str] = None

# Co-pilot Functions
async def get_recipe_suggestions_with_ai(available_ingredients: List[str], cuisine: str, dietary_restrictions: List[str], cooking_time: Optional[int] = None) -> Dict[str, Any]:
    """Generate recipe suggestions based on available ingredients using LLM"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-suggestions-{uuid.uuid4()}",
            system_message=f"""You are Nutrichef AI, an expert culinary AI assistant specializing in {cuisine} cuisine. You help users create delicious recipes from whatever ingredients they have available.

Your expertise includes:
- Traditional and modern {cuisine} cooking techniques
- Ingredient substitutions and adaptations
- Quick cooking methods for busy lifestyles
- Dietary accommodations and restrictions
- Step-by-step cooking guidance

When suggesting recipes, consider:
1. Available ingredients and how to best use them
2. Cooking time constraints
3. Dietary restrictions
4. Skill level and equipment
5. Flavor balance and authenticity

Return response as JSON with this structure:
{{
    "suggested_recipes": [
        {{
            "name": "Recipe Name",
            "description": "Brief description",
            "ingredients": ["ingredient1", "ingredient2"],
            "missing_ingredients": ["ingredient3"],
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "difficulty": "easy|medium|hard",
            "instructions": ["step1", "step2"],
            "tips": "Helpful cooking tips",
            "why_this_recipe": "Why this recipe works with available ingredients"
        }}
    ],
    "ingredient_usage": {{
        "fully_used": ["ingredients that are fully utilized"],
        "partially_used": ["ingredients used but you might have leftover"],
        "not_used": ["ingredients not used in any recipe"]
    }},
    "shopping_list": ["items you might want to buy"],
    "general_tips": "General advice for cooking with these ingredients"
}}"""
        ).with_model("groq", "llama-3.1-8b-instant")
        
        restrictions_text = f" with dietary restrictions: {', '.join(dietary_restrictions)}" if dietary_restrictions else ""
        time_text = f" in under {cooking_time} minutes" if cooking_time else ""
        
        user_message = UserMessage(
            text=f"I have these ingredients available: {', '.join(available_ingredients)}. Please suggest 3-5 {cuisine} recipes I can make{restrictions_text}{time_text}. Focus on recipes that use most of my available ingredients and provide practical cooking advice."
        )
        
        response = await chat.send_message(user_message)
        
        try:
            response_text = str(response).strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            suggestions_data = json.loads(response_text)
            return suggestions_data
        except json.JSONDecodeError:
            return {
                "suggested_recipes": [{
                    "name": "Quick Mixed Vegetable Curry",
                    "description": "A versatile curry using available ingredients",
                    "ingredients": available_ingredients[:5],
                    "missing_ingredients": ["garam masala", "coconut milk"],
                    "prep_time_minutes": 10,
                    "cook_time_minutes": 20,
                    "difficulty": "easy",
                    "instructions": ["Heat oil", "Add ingredients", "Cook until done"],
                    "tips": "Adjust spices to taste",
                    "why_this_recipe": "Uses most of your available ingredients"
                }],
                "ingredient_usage": {
                    "fully_used": available_ingredients[:3],
                    "partially_used": [],
                    "not_used": available_ingredients[3:]
                },
                "shopping_list": ["garam masala", "coconut milk"],
                "general_tips": "Keep spices handy for quick flavor enhancement"
            }
    except Exception as e:
        logging.error(f"Error getting recipe suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recipe suggestions: {str(e)}")

async def analyze_recipe_with_ai(recipe_text: str) -> Dict[str, Any]:
    """Analyze recipe using Groq API and return structured nutrition and health data"""
    try:
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Groq API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-analyzer-{uuid.uuid4()}",
            system_message="""You are NutriChef AI, an expert nutritionist and recipe analyzer specializing in South Asian cuisine and health conditions like PCOS, diabetes, pre-diabetes, and high blood pressure.

Your task is to analyze recipes and provide comprehensive health and nutrition information in a specific JSON format.

CRITICAL: You must ALWAYS respond with valid JSON in this exact structure:

{
  "nutrition": {
    "calories": <number>,
    "protein": <number>,
    "carbs": <number>,
    "fat": <number>,
    "fiber": <number>
  },
  "macros": {
    "protein": <percentage as integer>,
    "carbs": <percentage as integer>,
    "fat": <percentage as integer>
  },
  "health": {
    "conditions": [
      {
        "name": "PCOS|Diabetes|High Blood Pressure",
        "safe": true/false,
        "note": "brief explanation"
      }
    ],
    "warnings": ["warning1", "warning2"]
  },
  "modifications": [
    {
      "category": "condition-friendly name",
      "suggestion": "specific modification advice"
    }
  ],
  "budget": {
    "total": <estimated total cost in USD>,
    "perServing": <cost per serving>,
    "category": "Budget|Moderate|Expensive",
    "ingredients": [
      {"name": "ingredient name", "cost": <estimated cost>}
    ]
  }
}

Guidelines:
- Analyze all ingredients for health impact
- Consider glycemic index, inflammation, sodium content
- Provide realistic cost estimates
- Give practical modification suggestions
- Always include analysis for PCOS, Diabetes, and High Blood Pressure
- Keep explanations concise but helpful"""
        ).with_model("groq", "llama-3.1-8b-instant")
        
        user_message = UserMessage(
            text=f"Please analyze this recipe and provide complete nutrition and health analysis:\n\n{recipe_text}"
        )
        
        response = await chat.send_message(user_message)
        
        try:
            response_text = str(response).strip()
            # Clean up response if it has markdown code blocks
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            # Parse the JSON response
            analysis_data = json.loads(response_text)
            return analysis_data
            
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse AI response as JSON: {e}")
            logging.error(f"Raw response: {response_text}")
            
            # Return fallback mock data
            return {
                "nutrition": {"calories": 350, "protein": 20, "carbs": 40, "fat": 15, "fiber": 6},
                "macros": {"protein": 23, "carbs": 46, "fat": 31},
                "health": {
                    "conditions": [
                        {"name": "PCOS", "safe": True, "note": "Moderate carb content - monitor portion size"},
                        {"name": "Diabetes", "safe": True, "note": "Good protein and fiber content"},
                        {"name": "High Blood Pressure", "safe": True, "note": "Check sodium levels in spices"}
                    ],
                    "warnings": ["Monitor portion sizes", "Consider ingredient quality"]
                },
                "modifications": [
                    {"category": "PCOS-Friendly", "suggestion": "Add more vegetables for fiber"},
                    {"category": "Heart-Healthy", "suggestion": "Reduce oil if needed"}
                ],
                "budget": {
                    "total": 12.50,
                    "perServing": 3.13,
                    "category": "Moderate",
                    "ingredients": [
                        {"name": "Main ingredients", "cost": 8.00},
                        {"name": "Spices & seasonings", "cost": 4.50}
                    ]
                }
            }
            
    except Exception as e:
        logging.error(f"Error analyzing recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze recipe: {str(e)}")

async def get_cooking_guidance_with_ai(question: str, recipe_context: Optional[str] = None, step_context: Optional[str] = None) -> str:
    """Provide cooking guidance and answer questions using LLM"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        context_info = ""
        if recipe_context:
            context_info += f"\nRecipe context: {recipe_context}"
        if step_context:
            context_info += f"\nCurrent step: {step_context}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"cooking-guidance-{uuid.uuid4()}",
            system_message="""You are Nutrichef AI, an expert cooking assistant specializing in South Asian cuisine. You provide helpful, practical cooking advice in a friendly and encouraging manner.

Your expertise includes:
- Cooking techniques and troubleshooting
- Ingredient substitutions and adaptations
- Timing and temperature guidance
- Food safety and storage tips
- Flavor balancing and seasoning advice
- Equipment usage and alternatives

Always provide:
1. Clear, actionable advice
2. Explanation of why something works
3. Alternative solutions when possible
4. Encouragement and confidence building
5. Food safety considerations when relevant

Keep responses conversational but informative, like a knowledgeable friend helping in the kitchen."""
        ).with_model("groq", "llama-3.1-8b-instant")
        
        user_message = UserMessage(
            text=f"Cooking question: {question}{context_info}\n\nPlease provide helpful cooking guidance."
        )
        
        response = await chat.send_message(user_message)
        return str(response)
        
    except Exception as e:
        logging.error(f"Error getting cooking guidance: {str(e)}")
        return "I'm having trouble accessing my knowledge right now, but here's some general advice: Take your time, taste as you go, and don't be afraid to adjust seasonings. Cooking is about learning and having fun!"

# Email Signup API Route

@api_router.post("/email-signup")
async def email_signup(request: EmailSignupRequest):
    """Collect email addresses for waitlist and updates"""
    try:
        # Validate email format
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email already exists
        existing_subscriber = await db.email_subscribers.find_one({
            "email": request.email.lower(),
            "active": True
        })
        
        if existing_subscriber:
            # Update existing subscriber info if provided
            update_data = {
                "updated_at": datetime.utcnow()
            }
            if request.name:
                update_data["name"] = request.name
            update_data["health_updates"] = request.healthUpdates
            update_data["source"] = request.source
            
            await db.email_subscribers.update_one(
                {"email": request.email.lower()},
                {"$set": update_data}
            )
            
            return {
                "success": True,
                "message": "Email updated successfully! You're already on our waitlist.",
                "existing": True
            }
        
        # Create new subscriber
        subscriber = EmailSubscriber(
            email=request.email.lower(),
            name=request.name,
            health_updates=request.healthUpdates,
            source=request.source
        )
        
        # Save to database
        await db.email_subscribers.insert_one(subscriber.model_dump())
        
        # Log successful signup
        logging.info(f"New email subscriber: {request.email} from {request.source}")
        
        return {
            "success": True,
            "message": "Successfully joined the waitlist! We'll notify you when NutriChef AI launches.",
            "subscriber_id": subscriber.id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logging.error(f"Error in email signup: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process email signup")

@api_router.get("/email-subscribers")
async def get_email_subscribers():
    """Get all email subscribers (admin endpoint)"""
    try:
        subscribers = await db.email_subscribers.find({}).to_list(length=None)
        
        return {
            "success": True,
            "count": len(subscribers),
            "subscribers": subscribers
        }
        
    except Exception as e:
        logging.error(f"Error getting email subscribers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve subscribers")

# Recipe Analyzer API Route

@api_router.post("/recipe-analyzer")
async def recipe_analyzer(request: RecipeAnalyzerRequest):
    """Analyze recipe for nutrition, health impact, and budget information"""
    try:
        if not request.recipe or not request.recipe.strip():
            raise HTTPException(status_code=400, detail="Recipe text is required")
        
        # Analyze recipe using AI
        analysis = await analyze_recipe_with_ai(request.recipe)
        
        return {
            "success": True,
            "analysis": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 400, 500) as-is
        raise
    except Exception as e:
        logging.error(f"Error in recipe analyzer endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze recipe: {str(e)}")

# Co-pilot API Routes

@api_router.post("/copilot/recipe-suggestions")
async def get_recipe_suggestions(request: RecipeFromIngredientsRequest):
    """Get AI-powered recipe suggestions based on available ingredients"""
    try:
        suggestions = await get_recipe_suggestions_with_ai(
            available_ingredients=request.available_ingredients,
            cuisine=request.cuisine_preference,
            dietary_restrictions=request.dietary_restrictions,
            cooking_time=request.cooking_time_minutes
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error in recipe suggestions endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recipe suggestions: {str(e)}")

@api_router.post("/copilot/cooking-guidance")
async def get_cooking_guidance(request: CookingGuidanceRequest):
    """Get AI-powered cooking guidance and answer questions"""
    try:
        guidance = await get_cooking_guidance_with_ai(
            question=request.question,
            recipe_context=request.context,
            step_context=request.current_step
        )
        
        return {
            "success": True,
            "guidance": guidance,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error in cooking guidance endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cooking guidance: {str(e)}")

def format_recipe_for_chat(recipe_data: dict) -> str:
    """Format recipe conversion data for user-friendly chat display"""
    try:
        formatted = f"""**🍽️ Recipe Conversion Complete!**

**Quick Version**
{recipe_data.get('quick_version', 'Quick version not available')}

**⏱️ Time Breakdown**
• Prep Time: {recipe_data.get('prep_time_minutes', 0)} minutes
• Cook Time: {recipe_data.get('cook_time_minutes', 0)} minutes  
• Total Time: {recipe_data.get('total_time_minutes', 0)} minutes
• ⚡ Time Saved: {recipe_data.get('time_saved_minutes', 0)} minutes

**📝 Quick Instructions**"""

        # Add quick instructions
        quick_instructions = recipe_data.get('quick_instructions', [])
        if quick_instructions:
            for i, instruction in enumerate(quick_instructions, 1):
                formatted += f"\n{i}. {instruction}"
        else:
            formatted += "\nQuick instructions not available"

        # Add ingredients if available
        ingredients = recipe_data.get('ingredients', [])
        if ingredients:
            formatted += f"\n\n**🛒 Key Ingredients**"
            for ingredient in ingredients[:5]:  # Show first 5 ingredients
                formatted += f"\n• {ingredient}"
            if len(ingredients) > 5:
                formatted += f"\n• ...and {len(ingredients) - 5} more"

        # Add nutritional info
        nutrition = recipe_data.get('nutritional_info', {})
        if nutrition:
            formatted += f"\n\n**📊 Nutrition (per serving)**"
            formatted += f"\n• Calories: {nutrition.get('calories', 0):.0f}"
            formatted += f"\n• Protein: {nutrition.get('protein', 0):.0f}g"
            formatted += f"\n• Carbs: {nutrition.get('carbs', 0):.0f}g"
            formatted += f"\n• Fat: {nutrition.get('fat', 0):.0f}g"

        # Add tips if available
        tips = recipe_data.get('tips', '')
        if tips:
            formatted += f"\n\n**💡 Pro Tip**\n{tips}"

        # Add tags
        tags = recipe_data.get('tags', [])
        if tags:
            formatted += f"\n\n**🏷️ Tags:** {', '.join(tags)}"

        formatted += f"\n\n**Difficulty:** {recipe_data.get('difficulty_level', 'medium').title()}"

        return formatted

    except Exception as e:
        logging.error(f"Error formatting recipe for chat: {str(e)}")
        return "Recipe conversion completed, but formatting failed. Please try asking me to convert another recipe!"

@api_router.post("/copilot/chat")
async def copilot_chat(request: CopilotQuery):
    """General co-pilot chat for cooking questions and advice"""
    try:
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")

        # Check if the query contains JSON data (from recipe conversion)
        query_lower = request.query.lower()
        if ('quick_version' in request.query and 'prep_time_minutes' in request.query and 
            'nutritional_info' in request.query):
            # This looks like raw recipe conversion JSON - format it nicely
            try:
                recipe_data = json.loads(request.query)
                formatted_response = format_recipe_for_chat(recipe_data)
                return {
                    "success": True,
                    "response": formatted_response,
                    "timestamp": datetime.utcnow().isoformat()
                }
            except json.JSONDecodeError:
                # If it's not valid JSON, fall back to regular chat
                pass
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"copilot-chat-{uuid.uuid4()}",
            system_message="""You are Nutrichef AI, a friendly and knowledgeable AI cooking assistant specializing in South Asian cuisine.

CRITICAL FORMATTING RULES:
- Use **bold text** for section headers only (e.g., **Ingredients** or **Steps**)
- Use bullet points (• or -) for lists
- Use numbered lists (1. 2. 3.) for sequential steps
- Keep responses concise and well-organized
- No excessive text - focus on practical, actionable advice
- Maximum 200-300 words per response unless specifically asked for detailed recipes

RESPONSE STRUCTURE:
1. Brief welcome/context (1-2 lines)
2. Main sections with **headers**
3. Bullet points or numbered lists
4. Quick tip or encouragement at the end

EXAMPLE FORMAT:
**Ingredients**
• 1 cup basmati rice
• 2 cups water
• 1 tsp salt

**Steps**
1. Rinse rice until water runs clear
2. Boil water with salt
3. Add rice and simmer for 15 minutes

**Pro Tip**
Let it rest for 5 minutes before serving for perfectly fluffy rice!

PERSONALITY:
- Warm but concise
- Practical and solution-focused
- Encouraging without being wordy
- Authentic to South Asian cooking traditions

Keep responses structured, scannable, and immediately useful. Avoid long explanations unless specifically requested."""
        ).with_model("groq", "llama-3.1-8b-instant")
        
        context_text = f"\nContext: {request.context}" if request.context else ""
        
        user_message = UserMessage(
            text=f"{request.query}{context_text}"
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "response": str(response),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error in copilot chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get response: {str(e)}")

@api_router.post("/copilot/format-recipe")
async def format_recipe_conversion(request: dict):
    """Format raw recipe conversion data into user-friendly chat format"""
    try:
        formatted_response = format_recipe_for_chat(request)
        return {
            "success": True,
            "response": formatted_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error formatting recipe conversion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to format recipe: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()