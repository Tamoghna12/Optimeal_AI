"""
Configuration settings for the Homeland Meals API
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/homeland_meals')
DB_NAME = os.environ.get('DB_NAME', 'homeland_meals')

# LLM Configuration  
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000"
]

# Add origins from environment if available
if cors_env := os.environ.get('CORS_ORIGINS'):
    try:
        import json
        additional_origins = json.loads(cors_env)
        CORS_ORIGINS.extend(additional_origins)
    except json.JSONDecodeError:
        logging.warning("Invalid CORS_ORIGINS format in environment")

# Logging Configuration
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# API Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_IMAGE_FORMATS = {'png', 'jpg', 'jpeg', 'webp'}

# Nutrition Calculation Constants
BMR_ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
    "extremely_active": 1.9
}

CALORIE_ADJUSTMENT_FOR_GOALS = {
    "lose_weight": -500,  # 1 lb per week
    "gain_weight": 500,
    "maintain_weight": 0
}

def setup_logging():
    """Configure logging for the application"""
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL.upper()),
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(ROOT_DIR / 'app.log')
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("motor").setLevel(logging.WARNING)