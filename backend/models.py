"""
Data models for the Homeland Meals API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

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
    category: str = "main"  # "breakfast", "lunch", "dinner", "snacks", "main"
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
    category: str = "main"
    original_recipe: str
    servings: int = 4
    tags: List[str] = []

class RecipeConversion(BaseModel):
    original_recipe: str
    quick_version: str
    time_saved_minutes: int
    difficulty_level: str

class CopilotChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class CopilotResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None
    context: Optional[Dict[str, Any]] = None

class RecipeSuggestionRequest(BaseModel):
    available_ingredients: List[str]
    cuisine_preference: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None
    cooking_time_limit: Optional[int] = None

class CookingGuidanceRequest(BaseModel):
    recipe_name: str
    step_number: Optional[int] = None
    question: Optional[str] = None