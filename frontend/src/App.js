import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const CameraCapture = ({ onImageCapture, isCapturing, setIsCapturing, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please allow camera permissions.');
      }
    };

    if (isCapturing) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing]);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onImageCapture(blob);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    onClose();
  };

  if (!isCapturing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-center space-x-4">
            <button
              onClick={stopCamera}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              className="btn-primary px-8 py-3"
            >
              Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSetup = ({ onProfileCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderately_active',
    goal: 'maintain_weight',
    goal_weight_kg: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/profile`, {
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        goal_weight_kg: formData.goal_weight_kg ? parseFloat(formData.goal_weight_kg) : null
      });

      onProfileCreated(response.data);
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="heading-1 mb-4">Welcome to FitSpice</h1>
            <p className="body-large text-text-secondary">
              Your AI-powered nutrition companion for South Asian cuisine
            </p>
          </div>

          <div className="bg-bg-card rounded-12 p-8 border border-border-light">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.height_cm}
                    onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Activity Level
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({...formData, activity_level: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="sedentary">Sedentary (desk job, no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Goal
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain_weight">Maintain Weight</option>
                  <option value="gain_weight">Gain Weight</option>
                </select>
              </div>

              {formData.goal !== 'maintain_weight' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Goal Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.goal_weight_kg}
                    onChange={(e) => setFormData({...formData, goal_weight_kg: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const FoodAnalysis = ({ imageBlob, onAnalysisComplete, userId }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [mealType, setMealType] = useState('lunch');

  useEffect(() => {
    if (imageBlob) {
      analyzeFood();
    }
  }, [imageBlob]);

  const analyzeFood = async () => {
    setAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'food-image.jpg');
      formData.append('user_id', userId);
      formData.append('meal_type', mealType);

      const response = await axios.post(`${API}/analyze-food`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onAnalysisComplete(response.data);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Failed to analyze food. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg-page flex items-center justify-center p-6">
      <div className="bg-bg-card rounded-12 p-8 max-w-md w-full border border-border-light">
        <div className="text-center">
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <h3 className="heading-3 mb-2">Analyzing Your Food</h3>
              <p className="body-medium text-text-secondary">
                Our AI is identifying ingredients and calculating nutrition...
              </p>
            </>
          ) : (
            <>
              <h3 className="heading-3 mb-4">Select Meal Type</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`py-3 px-4 rounded-8 border transition-all ${
                      mealType === type 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : 'bg-bg-card text-text-primary border-border-medium hover:border-brand-primary'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={analyzeFood}
                className="btn-primary w-full py-3"
              >
                Analyze Food
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RecipeManager = ({ userId }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadRecipes();
  }, [filterTag]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      let url = `${API}/recipes/${userId}`;
      if (filterTag) {
        url += `?tag=${filterTag}`;
      }
      const response = await axios.get(url);
      setRecipes(response.data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId) => {
    try {
      await axios.put(`${API}/recipe/${recipeId}/favorite`);
      loadRecipes(); // Reload to get updated favorite status
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`${API}/recipe/${recipeId}`);
        loadRecipes();
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="heading-3">My Recipe Collection</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConvertForm(true)}
            className="btn-secondary px-4 py-2"
          >
            🔄 Convert Recipe
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary px-4 py-2"
          >
            ➕ Add Recipe
          </button>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTag('')}
          className={`px-3 py-1 rounded-8 text-sm ${
            filterTag === '' ? 'bg-brand-primary text-white' : 'bg-bg-section text-text-secondary'
          }`}
        >
          All
        </button>
        {['vegetarian', 'quick', 'student-friendly', 'traditional', 'vegan'].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`px-3 py-1 rounded-8 text-sm capitalize ${
              filterTag === tag ? 'bg-brand-primary text-white' : 'bg-bg-section text-text-secondary'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
          <h3 className="heading-4 mb-2">No Recipes Yet</h3>
          <p className="body-medium text-text-secondary mb-4">
            Start building your personal recipe collection! Add traditional family recipes and get AI-powered quick conversions.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary px-6 py-3"
          >
            Add Your First Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-bg-card rounded-12 p-6 border border-border-light">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-text-primary flex items-center">
                    {recipe.name}
                    {recipe.is_favorite && <span className="ml-2">❤️</span>}
                  </h4>
                  <p className="body-small text-text-secondary">{recipe.cuisine_type}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleFavorite(recipe.id)}
                    className="text-text-secondary hover:text-red-500"
                  >
                    {recipe.is_favorite ? '❤️' : '🤍'}
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="text-text-secondary hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="body-small text-text-secondary mb-4">{recipe.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-bg-section rounded-8 text-xs text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="font-medium text-brand-primary">{recipe.total_time_minutes}min</div>
                  <div className="body-small text-text-secondary">Total Time</div>
                </div>
                <div>
                  <div className="font-medium text-green-600">{recipe.time_saved_minutes}min</div>
                  <div className="body-small text-text-secondary">Time Saved</div>
                </div>
                <div>
                  <div className="font-medium text-orange-600">{recipe.difficulty_level}</div>
                  <div className="body-small text-text-secondary">Difficulty</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="btn-secondary py-2 text-sm"
                >
                  📖 View Traditional
                </button>
                <button
                  onClick={() => setSelectedRecipe({...recipe, showQuick: true})}
                  className="btn-primary py-2 text-sm"
                >
                  ⚡ Quick Version
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Creation Form */}
      {showCreateForm && (
        <CreateRecipeForm
          userId={userId}
          onClose={() => setShowCreateForm(false)}
          onRecipeCreated={() => {
            setShowCreateForm(false);
            loadRecipes();
          }}
        />
      )}

      {/* Recipe Conversion Form */}
      {showConvertForm && (
        <RecipeConversionForm
          onClose={() => setShowConvertForm(false)}
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
};

const CreateRecipeForm = ({ userId, onClose, onRecipeCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: 'South Asian',
    original_recipe: '',
    servings: 4,
    tags: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('user_id', userId);
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          // Convert tags array to JSON string
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      await axios.post(`${API}/recipe`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onRecipeCreated();
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Failed to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({...formData, tags: [...formData.tags, tag]});
    }
  };

  const removeTag = (tag) => {
    setFormData({...formData, tags: formData.tags.filter(t => t !== tag)});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
      <div className="bg-bg-card rounded-12 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="heading-3">Add New Recipe</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Recipe Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="e.g., Grandma's Chicken Curry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows="3"
              placeholder="Brief description of the recipe..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Cuisine Type
              </label>
              <select
                value={formData.cuisine_type}
                onChange={(e) => setFormData({...formData, cuisine_type: e.target.value})}
                className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="South Asian">South Asian</option>
                <option value="Indian">Indian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Sri Lankan">Sri Lankan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Servings
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.servings}
                onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Traditional Recipe
            </label>
            <textarea
              required
              value={formData.original_recipe}
              onChange={(e) => setFormData({...formData, original_recipe: e.target.value})}
              className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows="8"
              placeholder="Paste your traditional recipe here... Include ingredients and full cooking instructions."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-brand-primary text-white rounded-8 text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-white hover:text-red-200"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'spicy', 'mild', 'traditional', 'festive'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-3 py-1 bg-bg-section text-text-secondary hover:bg-brand-primary hover:text-white rounded-8 text-sm transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3"
            >
              {loading ? 'Creating Recipe...' : 'Create & Convert Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecipeConversionForm = ({ onClose }) => {
  const [recipeText, setRecipeText] = useState('');
  const [cuisineType, setCuisineType] = useState('South Asian');
  const [converting, setConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);

  const handleConvert = async (e) => {
    e.preventDefault();
    setConverting(true);

    try {
      const formData = new FormData();
      formData.append('recipe_text', recipeText);
      formData.append('cuisine_type', cuisineType);

      const response = await axios.post(`${API}/recipe/convert`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setConversionResult(response.data);
    } catch (error) {
      console.error('Error converting recipe:', error);
      alert('Failed to convert recipe. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
      <div className="bg-bg-card rounded-12 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="heading-3">Convert Traditional Recipe</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>

        {!conversionResult ? (
          <form onSubmit={handleConvert} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Cuisine Type
              </label>
              <select
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="South Asian">South Asian</option>
                <option value="Indian">Indian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Bangladeshi">Bangladeshi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Traditional Recipe
              </label>
              <textarea
                required
                value={recipeText}
                onChange={(e) => setRecipeText(e.target.value)}
                className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows="10"
                placeholder="Paste your traditional recipe here... Our AI will convert it to a quick, student-friendly version while maintaining authentic flavors."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={converting || !recipeText.trim()}
                className="btn-primary flex-1 py-3"
              >
                {converting ? 'Converting Recipe...' : 'Convert to Quick Version'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Recipe */}
              <div>
                <h4 className="heading-4 mb-3">Original Recipe</h4>
                <div className="bg-bg-section p-4 rounded-8 h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{recipeText}</pre>
                </div>
              </div>

              {/* Quick Version */}
              <div>
                <h4 className="heading-4 mb-3 flex items-center">
                  ⚡ Quick Version 
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-8 text-xs">
                    -{conversionResult.time_saved_minutes} min
                  </span>
                </h4>
                <div className="bg-bg-section p-4 rounded-8 h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{conversionResult.quick_version}</pre>
                </div>
              </div>
            </div>

            {/* Time Comparison */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-brand-primary">{conversionResult.total_time_minutes}min</div>
                <div className="body-small text-text-secondary">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{conversionResult.time_saved_minutes}min</div>
                <div className="body-small text-text-secondary">Time Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{conversionResult.difficulty_level}</div>
                <div className="body-small text-text-secondary">Difficulty</div>
              </div>
            </div>

            {/* Western Substitutions */}
            {conversionResult.western_substitutions && conversionResult.western_substitutions.length > 0 && (
              <div>
                <h5 className="font-medium text-text-primary mb-3">🛒 Western Grocery Store Substitutions:</h5>
                <div className="space-y-3">
                  {conversionResult.western_substitutions.map((sub, index) => (
                    <div key={index} className="bg-bg-section p-3 rounded-8">
                      <div className="font-medium">{sub.original} → {sub.substitute}</div>
                      <div className="body-small text-text-secondary">{sub.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Notes */}
            {conversionResult.cultural_notes && (
              <div>
                <h5 className="font-medium text-text-primary mb-2">🏛️ Cultural Context:</h5>
                <p className="body-small text-text-secondary bg-bg-section p-3 rounded-8">
                  {conversionResult.cultural_notes}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setConversionResult(null);
                  setRecipeText('');
                }}
                className="btn-secondary flex-1 py-3"
              >
                Convert Another Recipe
              </button>
              <button
                onClick={onClose}
                className="btn-primary flex-1 py-3"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RecipeDetailModal = ({ recipe, onClose }) => {
  const showQuick = recipe.showQuick;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
      <div className="bg-bg-card rounded-12 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="heading-3">{recipe.name}</h3>
            <p className="body-medium text-text-secondary">{recipe.cuisine_type} • {recipe.servings} servings</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recipe Content */}
          <div>
            <h4 className="heading-4 mb-4">
              {showQuick ? '⚡ Quick Version' : '📖 Traditional Recipe'}
            </h4>
            <div className="bg-bg-section p-4 rounded-8 mb-6">
              <pre className="whitespace-pre-wrap text-sm">
                {showQuick ? recipe.quick_version : recipe.original_recipe}
              </pre>
            </div>

            {showQuick && recipe.quick_instructions && recipe.quick_instructions.length > 0 && (
              <div>
                <h5 className="font-medium text-text-primary mb-3">Quick Steps:</h5>
                <ol className="space-y-2">
                  {recipe.quick_instructions.map((step, index) => (
                    <li key={index} className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center mr-3 mt-1">
                        {index + 1}
                      </span>
                      <span className="body-small">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Recipe Info */}
          <div className="space-y-6">
            {/* Time & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-section p-4 rounded-8 text-center">
                <div className="text-xl font-bold text-brand-primary">{recipe.total_time_minutes}min</div>
                <div className="body-small text-text-secondary">Total Time</div>
              </div>
              <div className="bg-bg-section p-4 rounded-8 text-center">
                <div className="text-xl font-bold text-orange-600 capitalize">{recipe.difficulty_level}</div>
                <div className="body-small text-text-secondary">Difficulty</div>
              </div>
            </div>

            {showQuick && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-8">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 mr-2">⚡</span>
                  <span className="font-medium text-green-800">Time Saved: {recipe.time_saved_minutes} minutes</span>
                </div>
              </div>
            )}

            {/* Nutritional Info */}
            {recipe.nutritional_info && (
              <div>
                <h5 className="font-medium text-text-primary mb-3">Nutrition per Serving</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-section p-3 rounded-8 text-center">
                    <div className="font-medium text-brand-primary">{Math.round(recipe.nutritional_info.calories)}</div>
                    <div className="body-small text-text-secondary">Calories</div>
                  </div>
                  <div className="bg-bg-section p-3 rounded-8 text-center">
                    <div className="font-medium text-green-600">{Math.round(recipe.nutritional_info.protein)}g</div>
                    <div className="body-small text-text-secondary">Protein</div>
                  </div>
                  <div className="bg-bg-section p-3 rounded-8 text-center">
                    <div className="font-medium text-orange-600">{Math.round(recipe.nutritional_info.carbs)}g</div>
                    <div className="body-small text-text-secondary">Carbs</div>
                  </div>
                  <div className="bg-bg-section p-3 rounded-8 text-center">
                    <div className="font-medium text-red-600">{Math.round(recipe.nutritional_info.fat)}g</div>
                    <div className="body-small text-text-secondary">Fat</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div>
                <h5 className="font-medium text-text-primary mb-3">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-bg-section rounded-8 text-sm text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Western Substitutions */}
            {showQuick && recipe.western_substitutions && recipe.western_substitutions.length > 0 && (
              <div>
                <h5 className="font-medium text-text-primary mb-3">🛒 Western Store Substitutions</h5>
                <div className="space-y-3">
                  {recipe.western_substitutions.map((sub, index) => (
                    <div key={index} className="bg-bg-section p-3 rounded-8">
                      <div className="font-medium text-sm">{sub.original} → {sub.substitute}</div>
                      <div className="body-small text-text-secondary">{sub.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Notes */}
            {recipe.cultural_notes && (
              <div>
                <h5 className="font-medium text-text-primary mb-2">🏛️ Cultural Context</h5>
                <p className="body-small text-text-secondary bg-bg-section p-3 rounded-8">
                  {recipe.cultural_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button onClick={onClose} className="btn-primary px-8 py-3">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('scan');
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [foodEntries, setFoodEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDailyStats();
    loadFoodEntries();
  }, []);

  const loadDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/daily-stats/${profile.id}/${today}`);
      setDailyStats(response.data);
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const loadFoodEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/food-entries/${profile.id}?date_filter=${today}`);
      setFoodEntries(response.data);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const handleImageCapture = (blob) => {
    setImageBlob(blob);
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setImageBlob(null);
    loadDailyStats();
    loadFoodEntries();
  };

  const startFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageBlob(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-light">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="heading-3">Welcome back, {profile.name}!</h1>
              <p className="body-small text-text-secondary">
                Daily target: {Math.round(profile.daily_calorie_target)} calories
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="btn-secondary px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      {dailyStats && (
        <div className="container mx-auto px-6 py-6">
          <div className="bg-bg-card rounded-12 p-6 border border-border-light mb-6">
            <h2 className="heading-4 mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {Math.round(dailyStats.calories_consumed)}
                </div>
                <div className="body-small text-text-secondary">Consumed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(dailyStats.calories_burned)}
                </div>
                <div className="body-small text-text-secondary">Burned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(dailyStats.remaining_calories)}
                </div>
                <div className="body-small text-text-secondary">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dailyStats.meals_logged}
                </div>
                <div className="body-small text-text-secondary">Meals</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6">
        <div className="flex space-x-1 bg-bg-section rounded-8 p-1 mb-6">
          {[
            { id: 'scan', label: 'Scan Food' },
            { id: 'diary', label: 'Food Diary' },
            { id: 'recipes', label: 'Recipes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-8 transition-all ${
                activeTab === tab.id
                  ? 'bg-bg-card shadow-sm text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
              <h2 className="heading-3 mb-4">Analyze Your Food</h2>
              <p className="body-medium text-text-secondary mb-6">
                Take a photo or upload an image of your meal to get instant nutritional analysis
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setIsCapturing(true)}
                  className="btn-primary px-6 py-3"
                >
                  📸 Take Photo
                </button>
                <button
                  onClick={startFileUpload}
                  className="btn-secondary px-6 py-3"
                >
                  📁 Upload Image
                </button>
              </div>
            </div>

            {analysisResult && (
              <div className="bg-bg-card rounded-12 p-6 border border-border-light">
                <h3 className="heading-4 mb-4">Analysis Result</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      {analysisResult.food_entry.meal_name}
                    </h4>
                    <p className="body-small text-text-secondary">
                      {analysisResult.food_entry.serving_size}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-lg font-bold text-brand-primary">
                        {Math.round(analysisResult.food_entry.calories_per_serving)}
                      </div>
                      <div className="body-small text-text-secondary">Calories</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(analysisResult.food_entry.protein_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(analysisResult.food_entry.carbs_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {Math.round(analysisResult.food_entry.fat_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Fat</div>
                    </div>
                  </div>

                  {analysisResult.ingredient_substitutions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">
                        Ingredient Substitutions for Western Stores:
                      </h5>
                      <div className="space-y-2">
                        {analysisResult.ingredient_substitutions.map((sub, index) => (
                          <div key={index} className="bg-bg-section p-3 rounded-8">
                            <div className="font-medium">{sub.original} → {sub.western_substitute}</div>
                            <div className="body-small text-text-secondary">{sub.notes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.quick_recipe_tips && (
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">Quick Recipe Tips:</h5>
                      <p className="body-small text-text-secondary bg-bg-section p-3 rounded-8">
                        {analysisResult.quick_recipe_tips}
                      </p>
                    </div>
                  )}

                  {/* Save Recipe Button */}
                  <div className="pt-4 border-t border-border-light">
                    <button
                      onClick={() => {
                        const recipeName = `${analysisResult.food_entry.meal_name} Recipe`;
                        const recipeDescription = `Recreate this delicious ${analysisResult.food_entry.meal_name} at home`;
                        const ingredients = analysisResult.food_entry.ingredients.join(', ');
                        const traditionalRecipe = `Ingredients: ${ingredients}\n\nThis is a traditional ${analysisResult.cultural_context || 'South Asian'} dish. ${analysisResult.quick_recipe_tips || 'Cook with love and traditional spices for authentic flavors.'}`;
                        
                        // You could open a save recipe modal here or add to recipe book directly
                        alert(`Recipe saving feature: Would save "${recipeName}" to your personal recipe collection with AI conversion to quick version!`);
                      }}
                      className="btn-secondary w-full py-3"
                    >
                      📖 Save to My Recipe Book
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="space-y-4">
            <h2 className="heading-3">Today's Food Diary</h2>
            {foodEntries.length === 0 ? (
              <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
                <p className="body-medium text-text-secondary">
                  No meals logged today. Start by scanning some food!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {foodEntries.map((entry) => (
                  <div key={entry.id} className="bg-bg-card rounded-12 p-6 border border-border-light">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-text-primary">{entry.meal_name}</h4>
                        <p className="body-small text-text-secondary">
                          {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)} • {entry.serving_size}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-brand-primary">
                          {Math.round(entry.calories_per_serving)} cal
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="font-medium">{Math.round(entry.protein_g)}g</div>
                        <div className="body-small text-text-secondary">Protein</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.carbs_g)}g</div>
                        <div className="body-small text-text-secondary">Carbs</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.fat_g)}g</div>
                        <div className="body-small text-text-secondary">Fat</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.fiber_g)}g</div>
                        <div className="body-small text-text-secondary">Fiber</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
              <h2 className="heading-3 mb-4">Recipe Suggestions</h2>
              <p className="body-medium text-text-secondary mb-6">
                Coming soon! We'll suggest healthy South Asian recipes adapted for your local ingredients.
              </p>
              <div className="bg-bg-section p-6 rounded-8">
                <h4 className="font-medium text-text-primary mb-2">Featured: Quick Dal Recipe</h4>
                <p className="body-small text-text-secondary">
                  Traditional dal made in 15 minutes using split red lentils (available at most Western grocery stores). 
                  Perfect for busy students and working professionals!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <CameraCapture
        onImageCapture={handleImageCapture}
        isCapturing={isCapturing}
        setIsCapturing={setIsCapturing}
        onClose={() => setIsCapturing(false)}
      />

      {/* Analysis Modal */}
      {imageBlob && (
        <FoodAnalysis
          imageBlob={imageBlob}
          onAnalysisComplete={handleAnalysisComplete}
          userId={profile.id}
        />
      )}
    </div>
  );
};

function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has a profile saved locally
    const savedProfile = localStorage.getItem('fitspice_profile');
    if (savedProfile) {
      setCurrentProfile(JSON.parse(savedProfile));
    }
    setLoading(false);
  }, []);

  const handleProfileCreated = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('fitspice_profile', JSON.stringify(profile));
  };

  const handleSignOut = () => {
    setCurrentProfile(null);
    localStorage.removeItem('fitspice_profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="body-medium text-text-secondary">Loading FitSpice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!currentProfile ? (
        <ProfileSetup onProfileCreated={handleProfileCreated} />
      ) : (
        <Dashboard profile={currentProfile} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

export default App;