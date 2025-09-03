"""
Utility functions for the Homeland Meals API
"""
import logging
from typing import Dict, Any
from .config import BMR_ACTIVITY_MULTIPLIERS, CALORIE_ADJUSTMENT_FOR_GOALS

logger = logging.getLogger(__name__)

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
    
    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters
        age: Age in years
        gender: "male" or "female"
    
    Returns:
        BMR in calories per day
    """
    try:
        if gender.lower() == "male":
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        
        logger.debug(f"Calculated BMR: {bmr} for {gender}, {age}y, {weight_kg}kg, {height_cm}cm")
        return round(bmr, 2)
    except Exception as e:
        logger.error(f"Error calculating BMR: {str(e)}")
        raise ValueError(f"Invalid parameters for BMR calculation: {str(e)}")

def calculate_daily_calories(bmr: float, activity_level: str, goal: str) -> float:
    """
    Calculate daily calorie target based on activity level and goal
    
    Args:
        bmr: Basal Metabolic Rate
        activity_level: Activity level string
        goal: Weight goal string
    
    Returns:
        Daily calorie target
    """
    try:
        # Get activity multiplier
        activity_multiplier = BMR_ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.2)
        maintenance_calories = bmr * activity_multiplier
        
        # Apply goal adjustment
        calorie_adjustment = CALORIE_ADJUSTMENT_FOR_GOALS.get(goal.lower(), 0)
        daily_calories = maintenance_calories + calorie_adjustment
        
        logger.debug(f"Calculated daily calories: {daily_calories} (BMR: {bmr}, Activity: {activity_level}, Goal: {goal})")
        return round(daily_calories, 2)
    except Exception as e:
        logger.error(f"Error calculating daily calories: {str(e)}")
        raise ValueError(f"Invalid parameters for daily calorie calculation: {str(e)}")

def validate_user_profile_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate user profile data and return any errors
    
    Args:
        data: User profile data dictionary
    
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    # Required fields
    required_fields = ['name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'goal']
    for field in required_fields:
        if field not in data or data[field] is None:
            errors[field] = f"{field} is required"
    
    # Age validation
    if 'age' in data and data['age'] is not None:
        try:
            age = int(data['age'])
            if age < 13 or age > 100:
                errors['age'] = "Age must be between 13 and 100"
        except (ValueError, TypeError):
            errors['age'] = "Age must be a valid number"
    
    # Height validation
    if 'height_cm' in data and data['height_cm'] is not None:
        try:
            height = float(data['height_cm'])
            if height < 100 or height > 250:
                errors['height_cm'] = "Height must be between 100 and 250 cm"
        except (ValueError, TypeError):
            errors['height_cm'] = "Height must be a valid number"
    
    # Weight validation
    if 'weight_kg' in data and data['weight_kg'] is not None:
        try:
            weight = float(data['weight_kg'])
            if weight < 30 or weight > 300:
                errors['weight_kg'] = "Weight must be between 30 and 300 kg"
        except (ValueError, TypeError):
            errors['weight_kg'] = "Weight must be a valid number"
    
    # Gender validation
    if 'gender' in data and data['gender'] is not None:
        if data['gender'].lower() not in ['male', 'female']:
            errors['gender'] = "Gender must be 'male' or 'female'"
    
    # Activity level validation
    if 'activity_level' in data and data['activity_level'] is not None:
        if data['activity_level'].lower() not in BMR_ACTIVITY_MULTIPLIERS:
            errors['activity_level'] = f"Activity level must be one of: {list(BMR_ACTIVITY_MULTIPLIERS.keys())}"
    
    # Goal validation
    if 'goal' in data and data['goal'] is not None:
        if data['goal'].lower() not in CALORIE_ADJUSTMENT_FOR_GOALS:
            errors['goal'] = f"Goal must be one of: {list(CALORIE_ADJUSTMENT_FOR_GOALS.keys())}"
    
    # Goal weight validation
    if 'goal_weight_kg' in data and data['goal_weight_kg'] is not None:
        try:
            goal_weight = float(data['goal_weight_kg'])
            if goal_weight < 30 or goal_weight > 300:
                errors['goal_weight_kg'] = "Goal weight must be between 30 and 300 kg"
        except (ValueError, TypeError):
            errors['goal_weight_kg'] = "Goal weight must be a valid number"
    
    logger.debug(f"Validation completed with {len(errors)} errors")
    return errors

def sanitize_recipe_data(recipe_text: str) -> str:
    """
    Sanitize recipe text for safe processing
    
    Args:
        recipe_text: Raw recipe text
    
    Returns:
        Sanitized recipe text
    """
    if not recipe_text:
        return ""
    
    # Remove potentially harmful content
    sanitized = recipe_text.strip()
    
    # Limit length to prevent excessive API calls
    max_length = 5000
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + "..."
        logger.warning(f"Recipe text truncated to {max_length} characters")
    
    logger.debug(f"Sanitized recipe text: {len(sanitized)} characters")
    return sanitized

def calculate_recipe_nutrition_per_serving(nutrition_data: Dict[str, float], servings: int) -> Dict[str, float]:
    """
    Calculate nutrition per serving from total nutrition data
    
    Args:
        nutrition_data: Total nutrition data
        servings: Number of servings
    
    Returns:
        Nutrition data per serving
    """
    if servings <= 0:
        raise ValueError("Servings must be greater than 0")
    
    per_serving = {}
    for nutrient, total_value in nutrition_data.items():
        if isinstance(total_value, (int, float)):
            per_serving[nutrient] = round(total_value / servings, 2)
        else:
            per_serving[nutrient] = total_value
    
    logger.debug(f"Calculated nutrition per serving for {servings} servings")
    return per_serving

def format_error_response(error_message: str, error_code: str = None) -> Dict[str, Any]:
    """
    Format error response consistently
    
    Args:
        error_message: Human-readable error message
        error_code: Optional error code for programmatic handling
    
    Returns:
        Formatted error response
    """
    response = {
        "error": True,
        "message": error_message,
        "timestamp": str(datetime.utcnow())
    }
    
    if error_code:
        response["error_code"] = error_code
    
    logger.error(f"Error response: {error_message}")
    return response

def format_success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """
    Format success response consistently
    
    Args:
        data: Response data
        message: Success message
    
    Returns:
        Formatted success response
    """
    response = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": str(datetime.utcnow())
    }
    
    logger.debug(f"Success response: {message}")
    return response