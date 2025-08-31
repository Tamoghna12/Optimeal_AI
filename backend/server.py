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
    date_consumed: date
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    activity_name: str
    duration_minutes: int
    calories_burned: float
    intensity: str  # "low", "moderate", "high"
    date_logged: date
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: date
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

class RecipeConversion(BaseModel):
    original_recipe: str
    quick_version: str
    time_saved_minutes: int
    difficulty_level: str

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
            date_logged=date.today()
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