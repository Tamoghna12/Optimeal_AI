import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import recipesData from './data/recipes.json';
import ingredientsPricing from './data/ingredients_pricing.json';

// Utility Functions
const calculateNutritionForServings = (nutrition, baseServings, desiredServings) => {
  if (!nutrition || !baseServings || !desiredServings) return nutrition;
  
  const multiplier = desiredServings / baseServings;
  return {
    caloriesPerServing: Math.round((nutrition.caloriesPerServing || 0) * multiplier),
    proteinG: Math.round((nutrition.proteinG || 0) * multiplier * 10) / 10,
    carbsG: Math.round((nutrition.carbsG || 0) * multiplier * 10) / 10,
    fatG: Math.round((nutrition.fatG || 0) * multiplier * 10) / 10,
    fiberG: Math.round((nutrition.fiberG || 0) * multiplier * 10) / 10,
    sugarG: Math.round((nutrition.sugarG || 0) * multiplier * 10) / 10
  };
};

const calculateCaloriesPerActualServing = (recipe, desiredServings) => {
  if (!recipe.nutrition || !recipe.baseServings) return recipe.nutrition?.caloriesPerServing || 0;
  
  // Calculate calories per actual serving when different from base
  const totalCalories = recipe.nutrition.caloriesPerServing * recipe.baseServings;
  return Math.round(totalCalories / desiredServings);
};

// Context for Global State Management
const MealTrayContext = React.createContext();

export const useMealTray = () => {
  const context = React.useContext(MealTrayContext);
  if (!context) {
    throw new Error('useMealTray must be used within MealTrayProvider');
  }
  return context;
};

const MealTrayProvider = ({ children }) => {
  // Change from array of IDs to array of objects with {id, servings}
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const addRecipe = (recipeId, servings = null) => {
    // Find recipe to get default servings
    const allRecipes = [...recipesData, ...loadUserCookbook()];
    const recipe = allRecipes.find(r => r.id === recipeId);
    const defaultServings = servings || (recipe ? recipe.baseServings || recipe.servings : 4);
    
    const existingIndex = selectedRecipes.findIndex(item => item.id === recipeId);
    if (existingIndex === -1) {
      const newRecipes = [...selectedRecipes, { id: recipeId, servings: defaultServings }];
      setSelectedRecipes(newRecipes);
      calculateCost(newRecipes);
    }
  };

  const removeRecipe = (recipeId) => {
    const newRecipes = selectedRecipes.filter(item => item.id !== recipeId);
    setSelectedRecipes(newRecipes);
    calculateCost(newRecipes);
  };

  const updateRecipeServings = (recipeId, newServings) => {
    const newRecipes = selectedRecipes.map(item => 
      item.id === recipeId ? { ...item, servings: newServings } : item
    );
    setSelectedRecipes(newRecipes);
    calculateCost(newRecipes);
  };

  const calculateCost = (recipes) => {
    let totalCost = 0;
    const ingredientTotals = {};

    // Get all recipes including user-generated ones
    const allRecipes = [...recipesData, ...loadUserCookbook()];

    // Consolidate ingredients from all selected recipes with serving adjustments
    recipes.forEach(recipeItem => {
      const recipe = allRecipes.find(r => r.id === recipeItem.id);
      if (recipe) {
        const baseServings = recipe.baseServings || recipe.servings || 4;
        const selectedServings = recipeItem.servings || baseServings;
        const servingMultiplier = selectedServings / baseServings;

        recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name;
          if (!ingredientTotals[key]) {
            ingredientTotals[key] = 0;
          }
          // Simple quantity parsing with serving adjustment
          const baseQuantity = parseFloat(ingredient.quantity) || 1;
          const adjustedQuantity = baseQuantity * servingMultiplier;
          ingredientTotals[key] += adjustedQuantity;
        });
      }
    });

    // Calculate cost based on consolidated ingredients
    Object.entries(ingredientTotals).forEach(([ingredientName, totalQuantity]) => {
      const pricing = ingredientsPricing[ingredientName];
      if (pricing) {
        // Simplified cost calculation - in real app would need better unit conversion
        totalCost += pricing.price * (totalQuantity / 100); // Rough approximation
      }
    });

    setEstimatedCost(totalCost);
  };

  const clearTray = () => {
    setSelectedRecipes([]);
    setEstimatedCost(0);
  };

  const getSelectedRecipesData = () => {
    const allRecipes = [...recipesData, ...loadUserCookbook()];
    return selectedRecipes.map(item => {
      const recipe = allRecipes.find(r => r.id === item.id);
      return recipe ? { ...recipe, selectedServings: item.servings } : null;
    }).filter(Boolean);
  };

  const getTotalCalories = () => {
    const selectedRecipesData = getSelectedRecipesData();
    let totalCalories = 0;
    
    selectedRecipesData.forEach(recipe => {
      if (recipe.nutrition && recipe.nutrition.caloriesPerServing) {
        // Calculate total calories for this recipe based on selected servings
        const recipeCalories = calculateCaloriesPerActualServing(recipe, recipe.selectedServings) * recipe.selectedServings;
        totalCalories += recipeCalories;
      }
    });
    
    return Math.round(totalCalories);
  };

  return (
    <MealTrayContext.Provider value={{
      selectedRecipes,
      estimatedCost,
      addRecipe,
      removeRecipe,
      updateRecipeServings,
      clearTray,
      getSelectedRecipesData,
      getTotalCalories
    }}>
      {children}
    </MealTrayContext.Provider>
  );
};

// Components
const Header = () => {
  const navigate = useNavigate();
  const location = window.location;
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="cursor-pointer"
            onClick={() => navigate('/')}
          >
            <h1 className="text-2xl font-bold text-primary font-lora">Desi Kitchen Co-Pilot</h1>
            <p className="text-sm text-gray-600 font-inter">Your taste of home, healthier and smarter</p>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className={`text-gray-600 hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary font-medium' : ''}`}
            >
              Browse
            </button>
            <button 
              onClick={() => navigate('/cookbook')}
              className={`text-gray-600 hover:text-primary transition-colors flex items-center ${location.pathname === '/cookbook' ? 'text-primary font-medium' : ''}`}
            >
              <span className="mr-1">📖</span>
              My Cookbook
            </button>
            <button 
              onClick={() => navigate('/copilot')}
              className={`text-gray-600 hover:text-primary transition-colors flex items-center ${location.pathname === '/copilot' ? 'text-primary font-medium' : ''}`}
            >
              <span className="mr-1">🤖</span>
              Co-pilot
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="text-gray-600 hover:text-primary transition-colors hidden md:block"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Cookbook Management Functions
const loadUserCookbook = () => {
  try {
    const savedCookbook = localStorage.getItem('homeland_user_cookbook');
    return savedCookbook ? JSON.parse(savedCookbook) : [];
  } catch (error) {
    console.error('Error loading cookbook:', error);
    return [];
  }
};

const saveUserCookbook = (cookbook) => {
  try {
    localStorage.setItem('homeland_user_cookbook', JSON.stringify(cookbook));
    return true;
  } catch (error) {
    console.error('Error saving cookbook:', error);
    return false;
  }
};

// Advanced AI Optimization Logic
const applyHealthOptimization = (recipe) => {
  const optimizedRecipe = JSON.parse(JSON.stringify(recipe)); // Deep clone
  const changes = [];

  // 1. Cooking Method Modification
  optimizedRecipe.instructions = optimizedRecipe.instructions.map(instruction => {
    let modifiedInstruction = instruction;
    
    if (instruction.toLowerCase().includes('deep fry') || instruction.toLowerCase().includes('fry in oil')) {
      modifiedInstruction = instruction.replace(/deep fry|fry in oil/gi, 'air-fry at 200°C or bake at 180°C');
      changes.push('Modified cooking method from deep frying to healthier air-frying/baking to reduce oil content');
    }
    
    if (instruction.toLowerCase().includes('fry') && !instruction.toLowerCase().includes('air-fry')) {
      modifiedInstruction = modifiedInstruction.replace(/fry/gi, 'pan-sear with minimal oil');
      changes.push('Reduced oil usage in cooking method for better heart health');
    }
    
    return modifiedInstruction;
  });

  // 2. Fat Source Swap
  optimizedRecipe.ingredients = optimizedRecipe.ingredients.map(ingredient => {
    let modifiedIngredient = { ...ingredient };
    
    if (ingredient.name.toLowerCase().includes('ghee') || ingredient.name.toLowerCase().includes('butter')) {
      modifiedIngredient.name = 'Extra Virgin Olive Oil';
      modifiedIngredient.originalName = ingredient.name;
      modifiedIngredient.isSwapped = true;
      changes.push(`Replaced ${ingredient.name} with Extra Virgin Olive Oil to reduce saturated fat and add heart-healthy monounsaturated fats`);
    }
    
    if (ingredient.name.toLowerCase().includes('double cream') || ingredient.name.toLowerCase().includes('heavy cream')) {
      modifiedIngredient.name = 'Greek Yogurt';
      modifiedIngredient.originalName = ingredient.name;
      modifiedIngredient.isSwapped = true;
      changes.push(`Replaced ${ingredient.name} with Greek Yogurt to reduce fat and increase protein content`);
    }
    
    if (ingredient.name.toLowerCase().includes('vegetable oil')) {
      modifiedIngredient.name = 'Avocado Oil';
      modifiedIngredient.originalName = ingredient.name;
      modifiedIngredient.isSwapped = true;
      changes.push('Switched to Avocado Oil for higher smoke point and better nutrient profile');
    }
    
    return modifiedIngredient;
  });

  // 3. Carbohydrate Source Swap
  optimizedRecipe.ingredients = optimizedRecipe.ingredients.map(ingredient => {
    let modifiedIngredient = { ...ingredient };
    
    if (ingredient.name.toLowerCase().includes('basmati rice') && !ingredient.name.toLowerCase().includes('brown')) {
      modifiedIngredient.name = 'Brown Basmati Rice';
      modifiedIngredient.originalName = ingredient.name;
      modifiedIngredient.isSwapped = true;
      changes.push('Upgraded to Brown Basmati Rice for higher fiber and slower glucose release');
    }
    
    if (ingredient.name.toLowerCase().includes('plain flour') || ingredient.name.toLowerCase().includes('all-purpose flour')) {
      modifiedIngredient.name = 'Whole Wheat Flour';
      modifiedIngredient.originalName = ingredient.name;
      modifiedIngredient.isSwapped = true;
      changes.push('Switched to Whole Wheat Flour for increased fiber and B-vitamins');
    }
    
    return modifiedIngredient;
  });

  // 4. Nutrient & Fiber Boost
  const hasVegetables = optimizedRecipe.ingredients.some(ing => 
    ing.category === 'Fresh Produce' && 
    (ing.name.toLowerCase().includes('spinach') || 
     ing.name.toLowerCase().includes('bell pepper') ||
     ing.name.toLowerCase().includes('carrot') ||
     ing.name.toLowerCase().includes('peas'))
  );

  if (!hasVegetables && (recipe.name.toLowerCase().includes('chicken') || recipe.name.toLowerCase().includes('curry'))) {
    optimizedRecipe.ingredients.push({
      name: 'Fresh Spinach',
      quantity: '100g',
      category: 'Fresh Produce',
      isAdded: true
    });
    changes.push('Added spinach to boost iron, folate, and fiber content while maintaining authentic flavor');
  }

  // 5. Protein Enhancement
  if (recipe.name.toLowerCase().includes('dal') || recipe.name.toLowerCase().includes('lentil')) {
    const hasQuinoa = optimizedRecipe.ingredients.some(ing => ing.name.toLowerCase().includes('quinoa'));
    if (!hasQuinoa) {
      optimizedRecipe.ingredients.push({
        name: 'Quinoa',
        quantity: '50g',
        category: 'Rice & Grains',
        isAdded: true
      });
      changes.push('Added quinoa to create a complete protein profile with all essential amino acids');
    }
  }

  return {
    healthierRecipe: optimizedRecipe,
    summaryOfChanges: changes
  };
};

const applyBudgetOptimization = (shoppingList) => {
  const optimizedList = JSON.parse(JSON.stringify(shoppingList)); // Deep clone
  let totalSavings = 0;

  Object.entries(optimizedList.categories).forEach(([category, ingredients]) => {
    optimizedList.categories[category] = ingredients.map(ingredient => {
      const pricing = ingredientsPricing[ingredient.name];
      
      // Enhanced optimization with co-pilot intelligence
      if (pricing && pricing.budget_alternative && pricing.savings > 0) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative]?.price || (ingredient.price - pricing.savings),
          swapReason: pricing.reason || 'Budget optimization',
          category: pricing.category || 'BUDGET_OPTIMIZATION'
        };
      }

      return ingredient;
    });
  });

  optimizedList.totalSavings = totalSavings;
  optimizedList.originalCost = optimizedList.totalCost;
  optimizedList.totalCost = optimizedList.totalCost - totalSavings;

  return optimizedList;
};

// Co-Pilot Intelligence Components
const WhyChip = ({ category, reason, savings }) => {
  const getChipStyle = (category) => {
    if (category?.includes('BUDGET')) return 'budget';
    if (category?.includes('HEALTH')) return 'health';
    if (category?.includes('CONVENIENCE')) return 'convenience';
    if (category?.includes('FLAVOR')) return 'flavor';
    return 'budget';
  };

  const getIcon = (category) => {
    if (category?.includes('BUDGET')) return '🐷';
    if (category?.includes('HEALTH')) return '❤️';
    if (category?.includes('CONVENIENCE')) return '⚡';
    if (category?.includes('FLAVOR')) return '🌟';
    return '💡';
  };

  return (
    <span className={`why-chip ${getChipStyle(category)}`}>
      <span className="mr-1">{getIcon(category)}</span>
      {reason}
      {savings > 0 && <span className="ml-1">(-£{savings.toFixed(2)})</span>}
    </span>
  );
};

const ProactiveInsightBadge = ({ ingredient, onHover }) => {
  const pricing = ingredientsPricing[ingredient.name];
  
  if (!pricing || (!pricing.budget_alternative && !pricing.health_alternative)) {
    return null;
  }

  const getHintType = () => {
    if (pricing.budget_alternative && pricing.savings > 0) return 'budget-hint';
    if (pricing.health_alternative) return 'health-hint';
    return 'convenience-hint';
  };

  const getTooltipText = () => {
    if (pricing.budget_alternative && pricing.savings > 0) {
      return `💰 Save £${pricing.savings.toFixed(2)} with ${pricing.budget_alternative}`;
    }
    if (pricing.health_alternative) {
      return `🌿 Healthier option available: ${pricing.health_alternative}`;
    }
    return `⚡ Smart alternative available`;
  };

  const getHintIcon = () => {
    if (pricing.budget_alternative && pricing.savings > 0) return '🐷';
    if (pricing.health_alternative) return '🌿';
    return '⚡';
  };

  return (
    <div className="tooltip-container">
      <div className={`insight-badge ${getHintType()}`}>
        <span style={{ fontSize: '10px' }}>{getHintIcon()}</span>
      </div>
      <span className="tooltip-text">{getTooltipText()}</span>
    </div>
  );
};

const CoPilotDialog = ({ isOpen, onClose, ingredient, onSelection }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  if (!isOpen || !ingredient) return null;

  const pricing = ingredientsPricing[ingredient.name];
  const options = [];

  // Budget option
  if (pricing?.budget_alternative && pricing.savings > 0) {
    options.push({
      id: 'budget',
      type: 'Budget-Friendly',
      alternative: pricing.budget_alternative,
      savings: pricing.savings,
      icon: '🐷',
      description: `Save £${pricing.savings.toFixed(2)} while maintaining great taste`,
      reasoning: pricing.reason || 'More economical choice'
    });
  }

  // Health option  
  if (pricing?.health_alternative) {
    options.push({
      id: 'health',
      type: 'Health-Conscious',
      alternative: pricing.health_alternative,
      savings: pricing.health_savings || 0,
      icon: '🌿',
      description: 'Better nutritional profile for your wellness goals',
      reasoning: 'Supports heart health and reduces saturated fat intake'
    });
  }

  // Keep original option
  options.push({
    id: 'original',
    type: 'Keep Original',
    alternative: ingredient.name,
    savings: 0,
    icon: '✨',
    description: 'Stick with the authentic, traditional ingredient',
    reasoning: 'Maintains the most authentic flavor profile'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="copilot-dialog max-w-2xl w-full">
        <div className="flex items-center mb-6">
          <div className="text-2xl mr-3">🤖</div>
          <div>
            <h3 className="text-xl font-semibold">AI Co-Pilot Suggestion</h3>
            <p className="text-white/80">I found a few ways to optimize <strong>{ingredient.name}</strong> for your recipe:</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {options.map((option) => (
            <div
              key={option.id}
              className={`copilot-option ${selectedOption?.id === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedOption(option)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{option.icon}</span>
                  <div>
                    <h4 className="font-semibold text-lg">{option.type}</h4>
                    <p className="text-white/90 font-medium">{option.alternative}</p>
                    <p className="text-white/70 text-sm mt-1">{option.description}</p>
                    <p className="text-white/60 text-xs mt-2 italic">💡 {option.reasoning}</p>
                  </div>
                </div>
                <div className="text-right">
                  {option.savings > 0 && (
                    <div className="text-green-300 font-bold">
                      Save £{option.savings.toFixed(2)}
                    </div>
                  )}
                  {option.savings < 0 && (
                    <div className="text-yellow-300 font-bold">
                      +£{Math.abs(option.savings).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              if (selectedOption) {
                onSelection(selectedOption);
                onClose();
              }
            }}
            disabled={!selectedOption}
            className="flex-1 bg-white hover:bg-white/90 text-purple-800 py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply This Choice
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Shopping List Components with Co-Pilot Intelligence
const EnhancedShoppingItem = ({ ingredient, index, onOptimizeItem }) => {
  const [showCoPilotDialog, setShowCoPilotDialog] = useState(false);

  const handleCoPilotSelection = (option) => {
    if (option.id !== 'original') {
      const optimizedIngredient = {
        ...ingredient,
        name: option.alternative,
        originalName: ingredient.name,
        isSwapped: true,
        savings: option.savings,
        swapReason: option.reasoning,
        category: option.type,
        price: ingredient.price - (option.savings || 0)
      };
      onOptimizeItem && onOptimizeItem(index, optimizedIngredient);
    }
  };

  return (
    <>
      <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
        ingredient.isSwapped ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            className="mr-3 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 text-base">
                {ingredient.name}
              </span>
              
              {ingredient.isSwapped && ingredient.category && ingredient.swapReason && (
                <WhyChip 
                  category={ingredient.category}
                  reason={ingredient.swapReason}
                  savings={ingredient.savings}
                />
              )}
              
              {!ingredient.isSwapped && (
                <ProactiveInsightBadge 
                  ingredient={ingredient}
                  onHover={() => setShowCoPilotDialog(true)}
                />
              )}
            </div>
            
            <div className="text-sm text-gray-800 mt-1">
              <span className="font-medium text-gray-900">{ingredient.totalQuantity}</span>
              {ingredient.recipes.length === 1 && (
                <div className="text-xs text-gray-600 mt-1">
                  For: {ingredient.recipes[0]}
                </div>
              )}
              {ingredient.recipes.length > 1 && (
                <div className="mt-1">
                  <span className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded-full font-medium">
                    Used in {ingredient.recipes.length} recipes
                  </span>
                  <div className="text-xs text-gray-600 mt-1">
                    {ingredient.recipes.join(', ')}
                  </div>
                </div>
              )}
              {ingredient.swapReason && (
                <div className="text-xs text-green-800 mt-1 font-medium">
                  💡 {ingredient.swapReason}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium text-gray-900">£{ingredient.price.toFixed(2)}</div>
          <div className="text-xs text-gray-700">{ingredient.unit}</div>
          {ingredient.isSwapped && ingredient.savings && (
            <div className="text-xs text-green-700 font-medium">
              Saved £{ingredient.savings.toFixed(2)}
            </div>
          )}
          {!ingredient.isSwapped && ingredientsPricing[ingredient.name]?.budget_alternative && (
            <button
              onClick={() => setShowCoPilotDialog(true)}
              className="text-xs text-primary hover:text-primary-dark mt-1 font-medium"
            >
              💡 Save money!
            </button>
          )}
        </div>
      </div>

      <CoPilotDialog
        isOpen={showCoPilotDialog}
        onClose={() => setShowCoPilotDialog(false)}
        ingredient={ingredient}
        onSelection={handleCoPilotSelection}
      />
    </>
  );
};

// Enhanced User Experience Features
const CookingTimer = ({ recipe, currentStep, onStepComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [stepTimers, setStepTimers] = useState({});

  useEffect(() => {
    let interval = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      setIsActive(false);
      onStepComplete && onStepComplete(currentStep);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining, currentStep, onStepComplete]);

  const startTimer = (minutes) => {
    setTimeRemaining(minutes * 60);
    setIsActive(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 mb-2">⏱️ Cooking Timer</h4>
      {isActive ? (
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{formatTime(timeRemaining)}</div>
          <button 
            onClick={() => setIsActive(false)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            Stop Timer
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => startTimer(5)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">5 min</button>
          <button onClick={() => startTimer(10)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">10 min</button>
          <button onClick={() => startTimer(15)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">15 min</button>
          <button onClick={() => startTimer(20)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">20 min</button>
        </div>
      )}
    </div>
  );
};

const RecipeRating = ({ recipeId, currentRating, onRatingChange }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (rating) => {
    setUserRating(rating);
    onRatingChange && onRatingChange(recipeId, rating);
    // Save to localStorage
    const ratings = JSON.parse(localStorage.getItem('homeland_recipe_ratings') || '{}');
    ratings[recipeId] = rating;
    localStorage.setItem('homeland_recipe_ratings', JSON.stringify(ratings));
  };

  useEffect(() => {
    // Load saved rating
    const ratings = JSON.parse(localStorage.getItem('homeland_recipe_ratings') || '{}');
    if (ratings[recipeId]) {
      setUserRating(ratings[recipeId]);
    }
  }, [recipeId]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-yellow-800 mb-2">⭐ Rate This Recipe</h4>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`text-2xl transition-colors ${
              star <= (hoverRating || userRating) ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            ⭐
          </button>
        ))}
        <span className="ml-2 text-sm text-yellow-700">
          {userRating > 0 ? `You rated: ${userRating}/5` : 'Tap to rate'}
        </span>
      </div>
    </div>
  );
};

const SmartShoppingIntegration = ({ shoppingList, onOrderOnline }) => {
  const [selectedStore, setSelectedStore] = useState('tesco');
  const [deliverySlot, setDeliverySlot] = useState('');

  const stores = {
    tesco: { name: 'Tesco', deliveryFee: 4.50, minOrder: 25 },
    asda: { name: 'ASDA', deliveryFee: 3.50, minOrder: 35 },
    sainsburys: { name: "Sainsbury's", deliveryFee: 5.00, minOrder: 30 }
  };

  const calculateDeliveryTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-green-800 mb-4">🛒 Smart Shopping Integration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {Object.entries(stores).map(([key, store]) => (
          <button
            key={key}
            onClick={() => setSelectedStore(key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedStore === key 
                ? 'border-green-500 bg-green-100' 
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <div className="font-semibold">{store.name}</div>
            <div className="text-sm text-gray-600">Delivery: £{store.deliveryFee}</div>
            <div className="text-sm text-gray-600">Min order: £{store.minOrder}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-2">📦 Delivery Options</h4>
        <select 
          value={deliverySlot}
          onChange={(e) => setDeliverySlot(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select delivery slot</option>
          <option value="next-day">Next Day Delivery - {calculateDeliveryTime()}</option>
          <option value="2-3-days">2-3 Working Days</option>
          <option value="weekly">Weekly Recurring Order</option>
        </select>
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg p-4">
        <div>
          <div className="font-semibold">Total: £{shoppingList?.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">+ £{stores[selectedStore].deliveryFee} delivery</div>
        </div>
        <button
          onClick={() => onOrderOnline && onOrderOnline(selectedStore, deliverySlot)}
          disabled={!deliverySlot}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Order from {stores[selectedStore].name}
        </button>
      </div>
    </div>
  );
};

const GamificationDashboard = ({ userId }) => {
  const [userStats, setUserStats] = useState({
    cookingStreak: 0,
    recipesCooked: 0,
    badges: [],
    heritagePoints: 0,
    level: 1
  });

  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  useEffect(() => {
    loadUserStats();
  }, [userId]);

  const loadUserStats = () => {
    const stats = JSON.parse(localStorage.getItem(`homeland_user_stats_${userId}`) || '{}');
    setUserStats({
      cookingStreak: stats.cookingStreak || 0,
      recipesCooked: stats.recipesCooked || 0,
      badges: stats.badges || [],
      heritagePoints: stats.heritagePoints || 0,
      level: Math.floor((stats.heritagePoints || 0) / 100) + 1
    });
  };

  const awardBadge = (badgeType) => {
    const badges = {
      'first_recipe': { name: 'First Recipe', icon: '👨‍🍳', description: 'Cooked your first recipe!' },
      'north_indian_explorer': { name: 'North Indian Explorer', icon: '🍛', description: 'Tried 5 North Indian recipes' },
      'south_indian_master': { name: 'South Indian Master', icon: '🥞', description: 'Mastered dosa and sambar!' },
      'heritage_keeper': { name: 'Heritage Keeper', icon: '📜', description: 'Added 3 family recipes' },
      'budget_wizard': { name: 'Budget Wizard', icon: '💰', description: 'Saved £50 with smart shopping' },
      'streak_champion': { name: 'Streak Champion', icon: '🔥', description: '7-day cooking streak!' }
    };

    const badge = badges[badgeType];
    if (badge && !userStats.badges.includes(badgeType)) {
      const newStats = {
        ...userStats,
        badges: [...userStats.badges, badgeType],
        heritagePoints: userStats.heritagePoints + 50
      };
      setUserStats(newStats);
      localStorage.setItem(`homeland_user_stats_${userId}`, JSON.stringify(newStats));
      setNewBadge(badge);
      setShowBadgeModal(true);
    }
  };

  const availableBadges = [
    { id: 'first_recipe', name: 'First Recipe', icon: '👨‍🍳', earned: userStats.badges.includes('first_recipe') },
    { id: 'north_indian_explorer', name: 'North Indian Explorer', icon: '🍛', earned: userStats.badges.includes('north_indian_explorer') },
    { id: 'south_indian_master', name: 'South Indian Master', icon: '🥞', earned: userStats.badges.includes('south_indian_master') },
    { id: 'heritage_keeper', name: 'Heritage Keeper', icon: '📜', earned: userStats.badges.includes('heritage_keeper') },
    { id: 'budget_wizard', name: 'Budget Wizard', icon: '💰', earned: userStats.badges.includes('budget_wizard') },
    { id: 'streak_champion', name: 'Streak Champion', icon: '🔥', earned: userStats.badges.includes('streak_champion') }
  ];

  return (
    <>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-4">🏆 Your Culinary Journey</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{userStats.cookingStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{userStats.recipesCooked}</div>
            <div className="text-sm text-gray-600">Recipes Cooked</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{userStats.heritagePoints}</div>
            <div className="text-sm text-gray-600">Heritage Points</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">Level {userStats.level}</div>
            <div className="text-sm text-gray-600">Culinary Level</div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-purple-800 mb-3">🏅 Badges Earned ({userStats.badges.length}/6)</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {availableBadges.map((badge) => (
              <div 
                key={badge.id}
                className={`text-center p-3 rounded-lg border-2 ${
                  badge.earned 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-xs font-medium">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Badge Button - Remove in production */}
        <div className="text-center">
          <button
            onClick={() => awardBadge('first_recipe')}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            🎯 Test Badge Award
          </button>
        </div>
      </div>

      {/* Badge Award Modal */}
      {showBadgeModal && newBadge && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
            <div className="text-6xl mb-4">{newBadge.icon}</div>
            <h3 className="text-xl font-bold mb-2">Badge Unlocked!</h3>
            <h4 className="text-lg font-semibold text-purple-600 mb-2">{newBadge.name}</h4>
            <p className="text-gray-600 mb-4">{newBadge.description}</p>
            <div className="text-sm text-green-600 mb-6">+50 Heritage Points!</div>
            <button
              onClick={() => setShowBadgeModal(false)}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Recipe Components with Better Contrast
const EnhancedRecipeCard = ({ recipe, onViewRecipe }) => {
  const { selectedRecipes } = useMealTray();
  const isSelected = selectedRecipes.some(item => item.id === recipe.id);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'hard': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getCategoryInfo = (category) => {
    switch(category) {
      case 'breakfast': return { icon: '🌅', label: 'Breakfast', color: 'text-blue-700 bg-blue-100' };
      case 'snacks': return { icon: '🥨', label: 'Snacks', color: 'text-purple-700 bg-purple-100' };
      default: return { icon: '🍛', label: 'Main Course', color: 'text-orange-700 bg-orange-100' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200">
      <div 
        className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden"
        onClick={() => onViewRecipe(recipe.id)}
      >
        {recipe.imageUrl && recipe.imageUrl.includes('customer-assets') ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200" style={{display: recipe.imageUrl && recipe.imageUrl.includes('customer-assets') ? 'none' : 'flex'}}>
          <div className="text-6xl opacity-20">🍛</div>
        </div>
        <div className="absolute top-3 right-3">
          {isSelected && (
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
            {recipe.cookingTime}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-lora text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
        <p className="text-gray-800 text-sm mb-3 line-clamp-2">{recipe.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <span className="flex items-center">
              <span className="mr-1">👥</span>
              {recipe.servings}
            </span>
            <span className="flex items-center">
              <span className="mr-1">📍</span>
              {recipe.cuisine}
            </span>
            {recipe.nutrition?.caloriesPerServing && (
              <span className="flex items-center font-semibold text-orange-600">
                <span className="mr-1">🔥</span>
                {recipe.nutrition.caloriesPerServing} cal
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {/* Category Badge */}
          {recipe.category && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryInfo(recipe.category).color}`}>
              {getCategoryInfo(recipe.category).icon} {getCategoryInfo(recipe.category).label}
            </span>
          )}
          
          {/* Tags */}
          {recipe.tags.slice(0, recipe.category ? 1 : 2).map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => onViewRecipe(recipe.id)}
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
        >
          View Recipe
        </button>
      </div>
    </div>
  );
};

// Components
const AddRecipeModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseServings: 4,
    cookingTime: '',
    difficulty: 'Easy',
    cuisine: 'Home Style',
    instructions: ''
  });

  const [ingredients, setIngredients] = useState([
    { name: '', quantity: '', unit: '' }
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index, field, value) => {
    const updatedIngredients = ingredients.map((ingredient, i) => {
      if (i === index) {
        return { ...ingredient, [field]: value };
      }
      return ingredient;
    });
    setIngredients(updatedIngredients);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process ingredients into the new structured format
    const processedIngredients = ingredients
      .filter(ing => ing.name.trim()) // Only include ingredients with names
      .map(ingredient => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity ? parseFloat(ingredient.quantity) : null,
        unit: ingredient.unit.trim() || 'to taste',
        category: 'User Added'
      }));

    // Parse instructions from textarea
    const instructionLines = formData.instructions.split('\n').filter(line => line.trim());

    const recipe = {
      id: Date.now(), // Simple ID generation
      name: formData.name,
      description: formData.description,
      servings: parseInt(formData.baseServings), // Keep for compatibility
      baseServings: parseInt(formData.baseServings), // New field for dynamic serving
      cookingTime: formData.cookingTime,
      difficulty: formData.difficulty,
      cuisine: formData.cuisine,
      ingredients: processedIngredients,
      instructions: instructionLines,
      tags: ['Personal', 'Home Recipe'],
      userGenerated: true,
      imageUrl: '/images/user-recipe.jpg' // Placeholder
    };

    onSave(recipe);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      baseServings: 4,
      cookingTime: '',
      difficulty: 'Easy',
      cuisine: 'Home Style',
      instructions: ''
    });
    setIngredients([{ name: '', quantity: '', unit: '' }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold font-lora">Add Family Recipe</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Nani's Special Dal"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Time</label>
              <input
                type="text"
                value={formData.cookingTime}
                onChange={(e) => setFormData({...formData, cookingTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 30 minutes"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="A brief description of your recipe..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base number of servings for this recipe?</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.baseServings}
                onChange={(e) => setFormData({...formData, baseServings: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <select
                value={formData.cuisine}
                onChange={(e) => setFormData({...formData, cuisine: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Home Style">Home Style</option>
                <option value="North Indian">North Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Bengali">Bengali</option>
                <option value="Pakistani">Pakistani</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ingredients
              <span className="text-xs text-gray-500 ml-2">(Add ingredients one by one)</span>
            </label>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Amount"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      required
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="w-full h-10 text-red-500 hover:text-red-700 text-sm font-bold"
                      disabled={ingredients.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="text-primary hover:text-primary-dark text-sm font-medium"
              >
                + Add another ingredient
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Leave "Amount" empty for items like "salt to taste" or "garnish"
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions 
              <span className="text-xs text-gray-500">(One step per line)</span>
            </label>
            <textarea
              required
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="8"
              placeholder={`Heat oil in a large pan over medium heat\nAdd chopped onions and cook until golden\nAdd garlic and garam masala, cook for 1 minute\nAdd chicken pieces and cook until browned\nSimmer for 20 minutes until cooked through`}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Let's Cook!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PersonalCookbookView = () => {
  const navigate = useNavigate();
  const { addRecipe: addToMealTray, selectedRecipes } = useMealTray();
  const [userRecipes, setUserRecipes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    const cookbook = loadUserCookbook();
    setUserRecipes(cookbook);
  }, []);

  const handleSaveRecipe = (recipe) => {
    const updatedCookbook = [...userRecipes, recipe];
    if (saveUserCookbook(updatedCookbook)) {
      setUserRecipes(updatedCookbook);
      setShowAddModal(false);
    } else {
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleDeleteRecipe = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      const updatedCookbook = userRecipes.filter(recipe => recipe.id !== recipeId);
      if (saveUserCookbook(updatedCookbook)) {
        setUserRecipes(updatedCookbook);
      }
    }
  };

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 font-lora">Your family recipes live here</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Keep those precious recipes from home safe forever. I'll help you cook them and even create shopping lists! 
            Your nani's dal recipe deserves a special place. 💕
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary">{userRecipes.length}</div>
            <div className="text-sm text-gray-500">Family Recipes</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {userRecipes.filter(recipe => selectedRecipes.includes(recipe.id)).length}
            </div>
            <div className="text-sm text-gray-500">In Meal Tray</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">∞</div>
            <div className="text-sm text-gray-500">Memories Preserved</div>
          </div>
        </div>

        {/* Add Recipe Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <span className="text-xl mr-2">➕</span>
            Share a family recipe with me!
          </button>
        </div>

        {/* Recipe Grid */}
        {userRecipes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="text-6xl opacity-20 mb-4">📖</div>
            <h3 className="text-xl font-semibold mb-4 font-lora">Your Cookbook is Empty</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your personal collection of family recipes. Preserve those special dishes 
              that remind you of home and create a digital legacy for future generations.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Recipe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-20">👩‍🍳</div>
                  </div>
                  <div className="absolute top-3 right-3">
                    {selectedRecipes.includes(recipe.id) && (
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                      Family Recipe
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-lora text-lg font-semibold text-gray-800 mb-2">{recipe.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>👥 {recipe.servings}</span>
                      <span>📍 {recipe.cuisine}</span>
                      {recipe.cookingTime && <span>⏱️ {recipe.cookingTime}</span>}
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <button 
                      onClick={() => handleViewRecipe(recipe)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                    >
                      View Recipe
                    </button>
                    <button 
                      onClick={() => selectedRecipes.includes(recipe.id) ? null : addToMealTray(recipe.id)}
                      disabled={selectedRecipes.includes(recipe.id)}
                      className={`flex-1 py-2 px-3 rounded-lg transition-colors text-sm font-medium ${
                        selectedRecipes.includes(recipe.id)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-dark text-white'
                      }`}
                    >
                      {selectedRecipes.some(item => item.id === recipe.id) ? 'In Tray ✓' : 'Add to Tray'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="w-full text-red-500 hover:text-red-700 text-sm transition-colors"
                  >
                    Delete Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Recipe Modal */}
        <AddRecipeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveRecipe}
        />

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold font-lora">{selectedRecipe.name}</h3>
                  <p className="text-gray-600">{selectedRecipe.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ingredients */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 font-lora">Ingredients</h4>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                        <span>{ingredient.quantity} {ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 font-lora">Instructions</h4>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full text-sm flex items-center justify-center mr-3 mt-1">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <WeeklyMealTray />
    </div>
  );
};

const RecipeCard = ({ recipe, onViewRecipe }) => {
  return <EnhancedRecipeCard recipe={recipe} onViewRecipe={onViewRecipe} />;
};

const WeeklyMealTray = () => {
  const { selectedRecipes, estimatedCost, getSelectedRecipesData, removeRecipe } = useMealTray();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (selectedRecipes.length === 0) return null;

  const selectedRecipesData = getSelectedRecipesData();

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-primary hover:bg-primary-dark text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
        >
          <span className="text-xs font-bold">{selectedRecipes.length}</span>
        </button>
      </div>

      {/* Mobile Expanded Tray */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-lora text-lg font-semibold">Weekly Meal Tray</h3>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {selectedRecipesData.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🍛</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{recipe.name}</h4>
                      <p className="text-xs text-gray-500">{recipe.servings} servings</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeRecipe(recipe.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setIsExpanded(false);
                navigate('/shopping-list');
              }}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Generate Shopping List (£{estimatedCost.toFixed(2)})
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Tray */}
      <div className="hidden md:block fixed right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-xl shadow-lg p-4 w-72 z-40 border border-gray-100">
        <h3 className="font-lora text-lg font-semibold mb-4 text-center">Weekly Meal Tray</h3>
        
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {selectedRecipesData.map((recipe) => (
            <div key={recipe.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🍛</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{recipe.name}</h4>
                <p className="text-xs text-gray-500">{recipe.servings} servings</p>
              </div>
              <button 
                onClick={() => removeRecipe(recipe.id)}
                className="text-red-500 hover:text-red-700 text-xs flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/shopping-list')}
          className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Generate Shopping List
          <div className="text-sm opacity-90 mt-1">£{estimatedCost.toFixed(2)}</div>
        </button>
      </div>
    </>
  );
};

const HomeView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const cuisines = ['All', ...new Set(recipesData.map(recipe => recipe.cuisine))];
  const categories = ['All', 'Breakfast', 'Main Course', 'Snacks'];
  
  const filteredRecipes = recipesData.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || recipe.cuisine === selectedCuisine;
    
    // Map recipe categories to display categories
    const recipeCategory = recipe.category === 'breakfast' ? 'Breakfast' : 
                          recipe.category === 'snacks' ? 'Snacks' : 'Main Course';
    const matchesCategory = selectedCategory === 'All' || recipeCategory === selectedCategory;
    
    return matchesSearch && matchesCuisine && matchesCategory;
  });

  const handleViewRecipe = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://customer-assets.emergentagent.com/job_desi-kitchen-1/artifacts/4c8t9ady_banner.png"
            alt="Authentic South Asian Cuisine"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <h1 className="text-heading mb-6 hero-white-text">
            Let's cook the food you miss from home
          </h1>
          <p className="text-body mb-12 max-w-2xl mx-auto hero-white-text">
            I'll help you make authentic dishes with ingredients from your local Tesco. 
            Perfect for busy students and professionals who want a taste of home! 🏡
          </p>
          
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="What are you craving today?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium shadow-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="text-gray-800 font-medium">
                      {category === 'All' ? '🍽️ All Meals' : 
                       category === 'Breakfast' ? '🌅 Breakfast' :
                       category === 'Snacks' ? '🥨 Snacks' : '🍛 Main Course'}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium shadow-sm"
                >
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine} className="text-gray-800 font-medium">
                      {cuisine === 'All' ? '🌍 All Cuisines' : cuisine}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onViewRecipe={handleViewRecipe}
            />
          ))}
        </div>
        
        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Hmm, I couldn't find anything like that. Try searching for something else? 🤔</p>
          </div>
        )}
      </div>

      <WeeklyMealTray />
    </div>
  );
};

// Serving Size Stepper Component
const ServingSizeStepper = ({ currentServings, baseServings, onServingChange }) => {
  const handleDecrement = () => {
    if (currentServings > 1) {
      onServingChange(currentServings - 1);
    }
  };

  const handleIncrement = () => {
    if (currentServings < 20) { // Upper limit of 20 servings
      onServingChange(currentServings + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4 mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <span className="text-lg font-medium text-gray-800">Servings:</span>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleDecrement}
          disabled={currentServings <= 1}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold text-gray-700 transition-colors"
        >
          −
        </button>
        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
          {currentServings}
        </div>
        <button
          onClick={handleIncrement}
          disabled={currentServings >= 20}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold text-gray-700 transition-colors"
        >
          +
        </button>
      </div>
      {currentServings !== baseServings && (
        <span className="text-sm text-gray-600">
          (originally {baseServings} servings)
        </span>
      )}
    </div>
  );
};

const RecipeDetailView = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { addRecipe, removeRecipe, selectedRecipes, updateRecipeServings } = useMealTray();
  const [healthierVersion, setHealthierVersion] = useState(null);
  const [isHealthifying, setIsHealthifying] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  
  // Get recipe from both curated and user recipes
  const allRecipes = [...recipesData, ...loadUserCookbook()];
  const recipe = allRecipes.find(r => r.id === parseInt(recipeId));
  const selectedRecipe = selectedRecipes.find(item => item.id === parseInt(recipeId));
  const isInTray = !!selectedRecipe;
  
  // Dynamic serving size state - use tray servings if recipe is in tray
  const [desiredServings, setDesiredServings] = useState(
    selectedRecipe?.servings || recipe?.baseServings || recipe?.servings || 4
  );

  // Update serving size in tray when changed
  const handleServingChange = (newServings) => {
    setDesiredServings(newServings);
    if (isInTray) {
      updateRecipeServings(parseInt(recipeId), newServings);
    }
  };

  // Add recipe with current serving size
  const handleAddToTray = () => {
    addRecipe(parseInt(recipeId), desiredServings);
  };
  
  // Helper function to calculate display quantity
  const calculateDisplayQuantity = (ingredient, baseServings, desiredServings) => {
    if (ingredient.quantity === null || ingredient.quantity === undefined) {
      return ingredient.unit; // Return unit as-is for "to taste" items
    }
    
    const multiplier = desiredServings / baseServings;
    const displayQuantity = ingredient.quantity * multiplier;
    
    // Round to sensible precision
    const roundedQuantity = Math.round(displayQuantity * 10) / 10;
    
    // Convert decimals to fractions for common cases
    if (roundedQuantity === 0.5) return `½ ${ingredient.unit}`;
    if (roundedQuantity === 0.25) return `¼ ${ingredient.unit}`;
    if (roundedQuantity === 0.75) return `¾ ${ingredient.unit}`;
    if (roundedQuantity === 1.5) return `1½ ${ingredient.unit}`;
    
    return `${roundedQuantity} ${ingredient.unit}`;
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! I can't find that recipe</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Let's go back
          </button>
        </div>
      </div>
    );
  }

  const handleMakeHealthier = async () => {
    setIsHealthifying(true);
    
    // Simulate AI processing with actual optimization logic
    setTimeout(() => {
      const optimization = applyHealthOptimization(recipe);
      setHealthierVersion(optimization.healthierRecipe);
      setIsHealthifying(false);
    }, 2000);
  };

  const currentRecipe = healthierVersion || recipe;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          ← Back to Recipes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe Content */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl h-64 md:h-80 flex items-center justify-center mb-8 relative overflow-hidden">
              {recipe.imageUrl && recipe.imageUrl.includes('customer-assets') ? (
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200" style={{display: recipe.imageUrl && recipe.imageUrl.includes('customer-assets') ? 'none' : 'flex'}}>
                <div className="text-8xl opacity-30">🍛</div>
              </div>
              {healthierVersion && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✨ Healthier Version
                </div>
              )}
            </div>

            {/* Recipe Header */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 font-lora">{currentRecipe.name}</h1>
              <p className="text-gray-700 mb-6 leading-relaxed">{currentRecipe.description}</p>
              
              {/* Serving Size Stepper */}
              <ServingSizeStepper
                currentServings={desiredServings}
                baseServings={recipe.baseServings || recipe.servings}
                onServingChange={handleServingChange}
              />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{desiredServings}</div>
                  <div className="text-sm text-gray-600">Servings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recipe.cookingTime}</div>
                  <div className="text-sm text-gray-600">Cook Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {recipe.nutrition ? calculateCaloriesPerActualServing(recipe, desiredServings) : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Calories/serving</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    recipe.difficulty === 'Easy' ? 'text-green-600' :
                    recipe.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {recipe.difficulty}
                  </div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recipe.cuisine}</div>
                  <div className="text-sm text-gray-600">Cuisine</div>
                </div>
              </div>

              {/* Gamification & User Experience Features */}
              <GamificationDashboard userId={recipeId} />
              <RecipeRating recipeId={recipeId} />
              <CookingTimer recipe={currentRecipe} />

              {/* Health Changes Alert */}
              {healthierVersion && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">✨ Here's how I made this healthier for you:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>My approach:</strong> Smart ingredient swaps that keep the authentic taste!</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Cooking method optimization (reduce oil, enhance nutrients)</li>
                      <li>Smart fat source swaps (saturated → unsaturated)</li>
                      <li>Complex carbohydrate upgrades (fiber boost)</li>
                      <li>Micronutrient enhancement (vitamins & minerals)</li>
                    </ul>
                    
                    {healthierVersion.ingredients.filter(ing => ing.isSwapped || ing.isAdded).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="font-medium">What I changed:</p>
                        <ul className="mt-1 space-y-1">
                          {healthierVersion.ingredients
                            .filter(ing => ing.isSwapped || ing.isAdded)
                            .map((ing, index) => (
                              <li key={index} className="text-xs">
                                {ing.isSwapped ? `• ${ing.originalName} → ${ing.name}` : `• Added: ${ing.name}`}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleMakeHealthier}
                  disabled={isHealthifying}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isHealthifying ? '🔄 Working my magic...' : '✨ Make this healthier for me!'}
                </button>
                
                <button
                  onClick={() => setShowSubstitutes(!showSubstitutes)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  🇬🇧 What can I find at Tesco?
                </button>
                
                <button
                  onClick={() => isInTray ? removeRecipe(parseInt(recipeId)) : handleAddToTray()}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                    isInTray 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {isInTray ? '✕ Never mind, skip this one' : '🍽️ Let\'s cook this this week!'}
                </button>
              </div>
            </div>

            {/* Nutrition Facts */}
            {recipe.nutrition && (
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 font-lora">📊 Nutrition Facts</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {calculateCaloriesPerActualServing(recipe, desiredServings)} calories
                    </div>
                    <div className="text-sm text-gray-600">per serving ({desiredServings} servings total)</div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(recipe.nutrition.proteinG * desiredServings / (recipe.baseServings || recipe.servings))}g
                      </div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {Math.round(recipe.nutrition.carbsG * desiredServings / (recipe.baseServings || recipe.servings))}g
                      </div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {Math.round(recipe.nutrition.fatG * desiredServings / (recipe.baseServings || recipe.servings))}g
                      </div>
                      <div className="text-xs text-gray-600">Fat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {Math.round(recipe.nutrition.fiberG * desiredServings / (recipe.baseServings || recipe.servings))}g
                      </div>
                      <div className="text-xs text-gray-600">Fiber</div>
                    </div>
                  </div>
                  
                  {recipe.nutrition.sugarG && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Sugar: </span>
                        <span className="text-sm font-medium text-pink-600">
                          {Math.round(recipe.nutrition.sugarG * desiredServings / (recipe.baseServings || recipe.servings))}g
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UK Substitutes */}
            {showSubstitutes && (
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 font-lora">🇬🇧 Here's what I found at Tesco for you!</h3>
                <div className="grid gap-4">
                  {currentRecipe.ingredients.map((ingredient, index) => {
                    const pricing = ingredientsPricing[ingredient.name];
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{ingredient.name}</span>
                          <span className="text-gray-700 ml-2">({ingredient.quantity})</span>
                        </div>
                        {pricing && pricing.budget_alternative ? (
                          <div className="text-sm">
                            <span className="text-blue-700">Available: {pricing.budget_alternative}</span>
                            <span className="text-green-700 ml-2">(Save £{pricing.savings?.toFixed(2)})</span>
                          </div>
                        ) : (
                          <span className="text-green-700 text-sm">✓ Easy to find!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ingredients and Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 font-lora">Ingredients</h3>
                <ul className="space-y-3">
                  {currentRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                      <span className={ingredient.isSwapped ? 'text-green-700 font-medium' : 'text-gray-900 font-medium'}>
                        {calculateDisplayQuantity(ingredient, recipe.baseServings || recipe.servings, desiredServings)} {ingredient.name}
                        {ingredient.isSwapped && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                            Healthier swap!
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 font-lora">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full text-sm flex items-center justify-center mr-3 mt-1">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 leading-relaxed">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Recipe Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span key={index} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Perfect for Loughborough Students</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Ingredients available at local Tesco</li>
                <li>✓ Budget-friendly options provided</li>
                <li>✓ Batch cooking friendly</li>
                <li>✓ Authentic taste of home</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <WeeklyMealTray />
    </div>
  );
};

const ShoppingListView = () => {
  const navigate = useNavigate();
  const { selectedRecipes, getSelectedRecipesData, clearTray, getTotalCalories } = useMealTray();
  const [shoppingList, setShoppingList] = useState(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    generateShoppingList();
  }, [selectedRecipes]);

  const generateShoppingList = () => {
    if (selectedRecipes.length === 0) {
      navigate('/');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const selectedRecipesData = getSelectedRecipesData();
      const consolidatedIngredients = {};
      let totalCost = 0;

      // Consolidate ingredients with proper serving size scaling
      selectedRecipesData.forEach(recipe => {
        const baseServings = recipe.baseServings || recipe.servings;
        const selectedServings = recipe.selectedServings;
        
        recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name;
          
          // Calculate scaled quantity for this recipe's selected serving size
          let scaledQuantity;
          if (ingredient.quantity === null || ingredient.quantity === undefined) {
            scaledQuantity = ingredient.unit; // "to taste" items
          } else {
            const multiplier = selectedServings / baseServings;
            const rawScaledQuantity = ingredient.quantity * multiplier;
            const roundedQuantity = Math.round(rawScaledQuantity * 10) / 10;
            
            // Convert decimals to fractions for display
            if (roundedQuantity === 0.5) scaledQuantity = `½ ${ingredient.unit}`;
            else if (roundedQuantity === 0.25) scaledQuantity = `¼ ${ingredient.unit}`;
            else if (roundedQuantity === 0.75) scaledQuantity = `¾ ${ingredient.unit}`;
            else if (roundedQuantity === 1.5) scaledQuantity = `1½ ${ingredient.unit}`;
            else scaledQuantity = `${roundedQuantity} ${ingredient.unit}`;
          }
          
          if (!consolidatedIngredients[key]) {
            consolidatedIngredients[key] = {
              name: ingredient.name,
              category: ingredient.category || 'User Added',
              totalQuantity: scaledQuantity,
              recipes: [`${recipe.name} (${selectedServings} servings)`],
              price: ingredientsPricing[ingredient.name]?.price || 0,
              unit: ingredientsPricing[ingredient.name]?.unit || 'item'
            };
          } else {
            consolidatedIngredients[key].recipes.push(`${recipe.name} (${selectedServings} servings)`);
            // Add the scaled quantities - in a real app, we'd properly convert and sum units
            consolidatedIngredients[key].totalQuantity += ` + ${scaledQuantity}`;
          }
        });
      });

      // Group by category and calculate costs
      const categorizedList = {};
      Object.values(consolidatedIngredients).forEach(ingredient => {
        if (!categorizedList[ingredient.category]) {
          categorizedList[ingredient.category] = [];
        }
        categorizedList[ingredient.category].push(ingredient);
        totalCost += ingredient.price;
      });

      setShoppingList({
        categories: categorizedList,
        totalCost,
        totalItems: Object.keys(consolidatedIngredients).length,
        recipes: selectedRecipesData
      });
      
      setIsGenerating(false);
    }, 1500);
  };

  const optimizeForBudget = () => {
    setIsOptimizing(true);
    
    // Apply sophisticated budget optimization algorithm
    setTimeout(() => {
      const optimizedList = applyBudgetOptimization(shoppingList);
      setShoppingList(optimizedList);
      setIsOptimized(true);
      setIsOptimizing(false);
    }, 2000);
  };

  const handleOrderOnline = (store, deliverySlot) => {
    alert(`🛒 Redirecting to ${store.toUpperCase()} online shopping...\nDelivery: ${deliverySlot}\nThis would integrate with actual supermarket APIs in production.`);
  };

  if (selectedRecipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Let's pick some recipes first!</h2>
          <p className="text-gray-700 mb-6">I need to know what you want to cook before I can make your shopping list 😊</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Show me the recipes!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-700 hover:text-primary mb-6 transition-colors font-medium"
        >
          ← Back to Recipes
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 font-lora">Here's everything you need!</h1>
            <p className="text-gray-700">I've organized this perfectly for your next Tesco run 🛒</p>
            <div className="mt-3 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-800">
                <span className="font-medium">✓ Smart quantities:</span> All amounts are calculated based on your selected serving sizes
              </p>
            </div>
          </div>

          {isGenerating ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">I'm preparing your list...</h3>
              <p className="text-gray-700">Checking what you need and finding the best prices 💭</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{shoppingList.recipes.length}</div>
                    <div className="text-sm text-gray-600">Recipes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{shoppingList.totalItems}</div>
                    <div className="text-sm text-gray-600">Ingredients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{getTotalCalories()}</div>
                    <div className="text-sm text-gray-600">Total calories</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isOptimized ? 'text-green-600' : 'text-primary'}`}>
                      £{shoppingList.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isOptimized ? 'Your smart total' : 'Estimated cost'}
                    </div>
                  </div>
                  <div>
                    {isOptimized && shoppingList.totalSavings > 0 ? (
                      <>
                        <div className="text-2xl font-bold text-green-600">£{shoppingList.totalSavings.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Money saved!</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-orange-600">Student</div>
                        <div className="text-sm text-gray-600">Budget Friendly</div>
                      </>
                    )}
                  </div>
                </div>

                {!isOptimized && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={optimizeForBudget}
                      disabled={isOptimizing}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOptimizing ? '🔄 Finding better deals...' : '💰 Help me save some money!'}
                    </button>
                  </div>
                )}

                {isOptimized && shoppingList.originalCost && (
                  <div className="mt-4 text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                      <span className="text-green-800 font-medium">
                        🎉 Here's what I found for your budget! You'll save £{shoppingList.totalSavings.toFixed(2)} 
                        (was going to be £{shoppingList.originalCost.toFixed(2)})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Smart Shopping Integration */}
              <SmartShoppingIntegration 
                shoppingList={shoppingList}
                onOrderOnline={handleOrderOnline}
              />

              {/* Selected Recipes */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-gray-200">
                <h3 className="font-semibold mb-4 font-lora text-gray-900">Here's what we're cooking this week!</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shoppingList.recipes.map(recipe => (
                    <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍛</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">{recipe.name}</h4>
                        <p className="text-xs text-gray-600">{recipe.servings} servings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping List by Category */}
              <div className="space-y-6">
                {Object.entries(shoppingList.categories).map(([category, ingredients]) => (
                  <div key={category} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 font-lora flex items-center text-gray-900">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        {ingredients.length}
                      </span>
                      {category}
                    </h3>
                    
                    <div className="space-y-3">
                      {ingredients.map((ingredient, index) => (
                        <EnhancedShoppingItem
                          key={index}
                          ingredient={ingredient}
                          index={index}
                          onOptimizeItem={(idx, optimizedIngredient) => {
                            // Update the specific ingredient in the shopping list
                            const updatedCategories = { ...shoppingList.categories };
                            updatedCategories[category][idx] = optimizedIngredient;
                            
                            // Recalculate total cost and savings
                            let newTotalCost = 0;
                            let totalSavings = 0;
                            
                            Object.values(updatedCategories).forEach(categoryIngredients => {
                              categoryIngredients.forEach(ing => {
                                newTotalCost += ing.price;
                                if (ing.savings) totalSavings += ing.savings;
                              });
                            });
                            
                            setShoppingList({
                              ...shoppingList,
                              categories: updatedCategories,
                              totalCost: newTotalCost,
                              totalSavings: totalSavings,
                              originalCost: shoppingList.originalCost || shoppingList.totalCost
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  📝 Print this for me
                </button>
                
                <button
                  onClick={clearTray}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  🗑️ Start fresh
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  🍳 Let's add more recipes!
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AboutView = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 font-lora">About Desi Kitchen Co-Pilot</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-inter">
            Where AI meets authentic South Asian cuisine to help you cook the food you miss from home
          </p>
        </div>

        {/* Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm text-center border">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-lora">Preserve Heritage</h3>
            <p className="text-gray-700 text-sm font-inter">Keep family recipes alive for future generations</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm text-center border">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-lora">Smart Cooking</h3>
            <p className="text-gray-700 text-sm font-inter">AI-powered health and budget optimization</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm text-center border">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-lora">UK Integration</h3>
            <p className="text-gray-700 text-sm font-inter">Find ingredients at your local Tesco</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm text-center border">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-lora">Cultural Bridge</h3>
            <p className="text-gray-700 text-sm font-inter">Connect diaspora communities to home</p>
          </div>
        </div>

        {/* Creator Section - Simplified */}
        <div className="bg-gray-50 rounded-xl p-8 shadow-sm text-center border">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 font-lora">Meet the Creator</h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl text-white font-bold">TD</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-lora">Tamoghna Das</h3>
            <p className="text-gray-700 mb-4 font-inter">PhD Researcher & AI Innovation Leader</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Education</h4>
                <p className="text-sm text-gray-800">PhD Chemical Engineering<br/>Loughborough University</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-2">Expertise</h4>
                <p className="text-sm text-gray-800">AI & Machine Learning<br/>for Biological Systems</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-2">Impact</h4>
                <p className="text-sm text-gray-800">100+ Students Trained<br/>94% Satisfaction Rate</p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <a href="https://github.com/Tamoghna12" className="text-gray-700 hover:text-primary transition-colors">
                <span className="text-lg font-medium">📱 GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/tamoghnadas12" className="text-gray-700 hover:text-primary transition-colors">
                <span className="text-lg font-medium">💼 LinkedIn</span>
              </a>
              <a href="mailto:tamoghnadas.12@outlook.com" className="text-gray-700 hover:text-primary transition-colors">
                <span className="text-lg font-medium">📧 Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
          <h2 className="text-2xl font-semibold mb-6 font-lora text-center">Technical Innovation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-600">
                Advanced machine learning algorithms analyze recipes for health optimization and cost reduction
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="font-semibold mb-2">Real-time Processing</h3>
              <p className="text-sm text-gray-600">
                Instant recipe conversion and shopping list generation with UK supermarket integration
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold mb-2">Mobile-First Design</h3>
              <p className="text-sm text-gray-600">
                Responsive React application optimized for student lifestyle and on-the-go meal planning
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Collaboration */}
        <div className="bg-gradient-to-r from-primary to-orange-500 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-semibold mb-4 font-lora">Let's Connect & Collaborate</h2>
          <p className="mb-6 text-orange-100">
            Interested in the intersection of AI, food technology, and cultural preservation? 
            Let's discuss research collaborations, technical partnerships, or the future of diaspora-focused technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:tamoghnadas.12@outlook.com" 
              className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              📧 Email for Collaboration
            </a>
            <a 
              href="https://www.linkedin.com/in/tamoghnadas12" 
              className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors border border-white/30"
            >
              💼 Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Message Formatter
const formatAIMessage = (message) => {
  const sections = [];
  let currentSection = "";
  let currentType = "text";
  
  const lines = message.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentSection) {
        sections.push({ type: currentType, content: currentSection.trim() });
        currentSection = "";
      }
      continue;
    }
    
    // Check if line starts with **text**: or **text** (header)
    if (line.match(/^\*\*(.*?)\*\*:?\s*$/)) {
      // Save previous section
      if (currentSection) {
        sections.push({ type: currentType, content: currentSection.trim() });
      }
      
      // Start new header section
      const headerText = line.replace(/^\*\*(.*?)\*\*:?\s*$/, '$1');
      sections.push({ type: "header", content: headerText });
      currentSection = "";
      currentType = "text";
      continue;
    }
    
    // Check if line starts with bullet point
    if (line.match(/^[•\-*]\s+/) || line.match(/^\d+\.\s+/)) {
      // If we were building text, save it first
      if (currentType !== "list" && currentSection) {
        sections.push({ type: currentType, content: currentSection.trim() });
        currentSection = "";
      }
      currentType = "list";
      currentSection += line + '\n';
      continue;
    }
    
    // Regular text
    if (currentType !== "text" && currentSection) {
      sections.push({ type: currentType, content: currentSection.trim() });
      currentSection = "";
      currentType = "text";
    }
    
    currentSection += line + '\n';
  }
  
  // Add final section
  if (currentSection) {
    sections.push({ type: currentType, content: currentSection.trim() });
  }
  
  // Render sections
  return sections.map((section, index) => {
    switch (section.type) {
      case "header":
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0">
            {section.content}
          </h3>
        );
      
      case "list":
        const listItems = section.content.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="space-y-2 ml-4 mb-4">
            {listItems.map((item, itemIndex) => {
              const cleanItem = item.replace(/^[•\-*]\s+/, '').replace(/^\d+\.\s+/, '');
              return (
                <li key={itemIndex} className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                  <span className="text-gray-800 leading-relaxed">{cleanItem}</span>
                </li>
              );
            })}
          </ul>
        );
      
      case "text":
        // Split by double newlines for paragraphs
        const paragraphs = section.content.split('\n\n').filter(p => p.trim());
        return paragraphs.map((paragraph, pIndex) => (
          <p key={`${index}-${pIndex}`} className="text-gray-800 leading-relaxed mb-3">
            {paragraph.trim()}
          </p>
        ));
      
      default:
        return (
          <p key={index} className="text-gray-800 leading-relaxed mb-3">
            {section.content}
          </p>
        );
    }
  });
};

// Co-pilot View Component
const CopilotView = () => {
  const [activeMode, setActiveMode] = useState('chat');
  
  // Load chat history from localStorage or default welcome message
  const [chatMessages, setChatMessages] = useState(() => {
    const savedMessages = localStorage.getItem('copilot_chat_history');
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.warn('Failed to parse saved chat history');
      }
    }
    return [
      {
        type: 'ai',
        message: `👋 Welcome to Nutrichef AI! Your AI sous chef for South Asian cuisine.

**I can help you with**
• Recipe suggestions from your ingredients
• Step-by-step cooking guidance
• Ingredient substitutions
• Traditional techniques and shortcuts
• Spice blending and flavor tips
**Ready to cook?**
Ask me anything about South Asian dishes!`,
        timestamp: new Date()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState('');
  const [recipeSuggestions, setRecipeSuggestions] = useState(null);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [cookingTime, setCookingTime] = useState('');
  const { getSelectedRecipesData } = useMealTray();
  const selectedRecipesData = getSelectedRecipesData();
  
  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('copilot_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const clearChatHistory = () => {
    const confirmClear = window.confirm('Are you sure you want to clear your chat history? This cannot be undone.');
    if (confirmClear) {
      setChatMessages([
        {
          type: 'ai',
          message: `👋 Welcome back to Nutrichef AI! How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const exportChatHistory = () => {
    const chatText = chatMessages.map(msg => {
      const timestamp = formatTime(msg.timestamp);
      const sender = msg.type === 'user' ? 'You' : 'Nutrichef AI';
      return `[${timestamp}] ${sender}: ${msg.message}`;
    }).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desi-kitchen-copilot-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add recipe context if user has selected recipes
      let contextMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].message : "";
      if (selectedRecipesData.length > 0) {
        const mealTrayInfo = `User's current meal tray contains: ${selectedRecipesData.map(r => r.name).join(', ')}`;
        contextMessage = contextMessage ? `${contextMessage}\n\n${mealTrayInfo}` : mealTrayInfo;
      }
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: inputMessage,
          context: selectedRecipesData.length > 0 ? `User has ${selectedRecipesData.length} recipes in meal tray: ${selectedRecipesData.map(r => r.name).join(', ')}` : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          type: 'ai',
          message: data.response || "I'm here to help with your cooking questions!",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMsg = "Sorry, I'm having trouble right now. Please try again in a moment!";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMsg = "🔌 Connection issue! Please check your internet connection and try again.";
      } else if (error.message.includes('500')) {
        errorMsg = "🤖 My circuits are a bit scrambled right now. The kitchen tech team is on it!";
      } else if (error.message.includes('404')) {
        errorMsg = "🔍 Hmm, I can't find that cooking endpoint. Let me check my recipe database...";
      }
      
      const errorMessage = {
        type: 'ai',
        message: errorMsg,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const getRecipeSuggestions = async () => {
    if (!availableIngredients.trim()) return;

    setIsLoading(true);
    try {
      const ingredientsList = availableIngredients.split(',').map(i => i.trim()).filter(i => i);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/copilot/recipe-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          available_ingredients: ingredientsList,
          cuisine_preference: "South Asian",
          dietary_restrictions: dietaryRestrictions,
          cooking_time_minutes: cookingTime ? parseInt(cookingTime) : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecipeSuggestions(data.suggestions);
      } else {
        throw new Error('Failed to get recipe suggestions');
      }
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      
      let errorMsg = 'Sorry, I couldn\'t get recipe suggestions right now. Please try again!';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMsg = 'Connection issue! Please check your internet connection and try again.';
      } else if (error.message.includes('500')) {
        errorMsg = 'My recipe database is taking a little break. Please try again in a moment!';
      }
      
      alert(`🍳 ${errorMsg}`);
    }

    setIsLoading(false);
  };

  const toggleDietaryRestriction = (restriction) => {
    setDietaryRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 Nutrichef AI
          </h1>
          <p className="text-gray-600 mb-4">
            Your AI-powered cooking assistant for South Asian cuisine. Get personalized recipe suggestions, cooking guidance, and culinary advice!
          </p>
          
          {selectedRecipesData.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-orange-800">
                <span className="font-medium">🍽️ Meal Context:</span> I can see you have {selectedRecipesData.length} recipe{selectedRecipesData.length > 1 ? 's' : ''} in your tray: {selectedRecipesData.map(r => r.name).join(', ')}. I can provide specific guidance for these dishes!
              </p>
            </div>
          )}

          {/* Mode Selection */}
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setActiveMode('chat')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeMode === 'chat' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'
              }`}
            >
              💬 Chat Assistant
            </button>
            <button
              onClick={() => setActiveMode('recipe-suggestions')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeMode === 'recipe-suggestions' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'
              }`}
            >
              🍳 Recipe Suggestions
            </button>
          </div>

          {activeMode === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Chat Container */}
              <div className="flex-1 min-h-[600px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto" style={{minHeight: '500px'}}>
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`border-b border-gray-200 ${
                      msg.type === 'user' ? 'bg-white' : 'bg-gray-50'
                    }`}>
                      <div className="max-w-4xl mx-auto px-6 py-6">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            msg.type === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-orange-600 text-white'
                          }`}>
                            {msg.type === 'user' ? 'U' : '🤖'}
                          </div>
                          
                          {/* Message Content */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {msg.type === 'user' ? 'You' : 'Nutrichef AI'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            
                            <div className={`prose prose-sm max-w-none ${
                              msg.type === 'user' ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                              {msg.type === 'ai' ? (
                                <div className="space-y-4">
                                  {formatAIMessage(msg.message)}
                                </div>
                              ) : (
                                <p className="leading-relaxed">{msg.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="bg-gray-50 border-b border-gray-100">
                      <div className="max-w-4xl mx-auto px-6 py-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                            🤖
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">Nutrichef AI</span>
                              <span className="text-xs text-gray-500">thinking...</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Section */}
                <div className="border-t border-gray-200 bg-white">
                  <div className="max-w-4xl mx-auto p-4">
                    
                    {/* Chat Actions */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2">
                        <button
                          onClick={clearChatHistory}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          title="Clear chat history"
                        >
                          🗑️ Clear
                        </button>
                        <button
                          onClick={exportChatHistory}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          title="Export chat as text file"
                        >
                          📄 Export
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {chatMessages.length - 1} message{chatMessages.length !== 2 ? 's' : ''} saved
                      </span>
                    </div>
                    {/* Quick Questions */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const hasRecipes = selectedRecipesData.length > 0;
                          const firstRecipe = hasRecipes ? selectedRecipesData[0] : null;
                          const recipeName = firstRecipe?.name || "your recipe";
                          
                          const questions = hasRecipes ? [
                            `How do I cook ${recipeName} perfectly?`,
                            `What sides pair well with ${recipeName}?`,
                            "Tips for meal prep with my selected recipes",
                            "How to adjust quantities for more servings?"
                          ] : [
                            "How to make perfect basmati rice?",
                            "What can I substitute for garam masala?",
                            "Quick 30-minute dinner ideas",
                            "How to adjust spice levels in curry?",
                            "Tips for making soft rotis",
                            "Best dal recipe for beginners"
                          ];
                          
                          return questions.map((questionText, index) => (
                            <button
                              key={index}
                              onClick={() => setInputMessage(questionText)}
                              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-200"
                            >
                              {questionText}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                    
                    {/* Chat Input */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative">
                        <textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder={selectedRecipesData.length > 0 
                            ? `Ask me about ${selectedRecipesData.map(r => r.name).join(', ')} or any cooking question...`
                            : "Ask me anything about South Asian cooking..."
                          }
                          className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 sm:text-base text-sm"
                          disabled={isLoading}
                          rows={1}
                          style={{minHeight: '48px', maxHeight: '120px'}}
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                          }}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={isLoading || !inputMessage.trim()}
                          className="absolute right-2 bottom-2 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                      {selectedRecipesData.length > 0 && (
                        <p className="text-xs text-orange-600">
                          💡 Context-aware suggestions available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMode === 'recipe-suggestions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingredient Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Ingredients (comma-separated)
                    </label>
                    <textarea
                      value={availableIngredients}
                      onChange={(e) => setAvailableIngredients(e.target.value)}
                      placeholder="e.g., onions, tomatoes, chicken, rice, cumin, garam masala..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cooking Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={cookingTime}
                      onChange={(e) => setCookingTime(e.target.value)}
                      placeholder="30"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-sodium'].map((restriction) => (
                        <button
                          key={restriction}
                          onClick={() => toggleDietaryRestriction(restriction)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            dietaryRestrictions.includes(restriction)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {restriction}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={getRecipeSuggestions}
                    disabled={isLoading || !availableIngredients.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Getting Suggestions...' : 'Get Recipe Suggestions'}
                  </button>
                </div>

                {/* Recipe Suggestions Display */}
                <div>
                  {recipeSuggestions && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Suggested Recipes</h3>
                      
                      {recipeSuggestions.suggested_recipes?.map((recipe, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">{recipe.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                            <span>⏱️ {recipe.prep_time_minutes + recipe.cook_time_minutes}min</span>
                            <span>👨‍🍳 {recipe.difficulty}</span>
                            <span>🥘 {recipe.ingredients?.length} ingredients</span>
                          </div>

                          {recipe.missing_ingredients?.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-red-600">Missing: </span>
                              <span className="text-xs text-red-500">
                                {recipe.missing_ingredients.join(', ')}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-orange-600 mb-2">💡 {recipe.why_this_recipe}</p>
                          
                          {recipe.tips && (
                            <p className="text-xs text-gray-500">💭 {recipe.tips}</p>
                          )}
                        </div>
                      ))}

                      {recipeSuggestions.general_tips && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">💡 General Tips</h4>
                          <p className="text-sm text-blue-700">{recipeSuggestions.general_tips}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <MealTrayProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/recipe/:recipeId" element={<RecipeDetailView />} />
            <Route path="/cookbook" element={<PersonalCookbookView />} />
            <Route path="/copilot" element={<CopilotView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/shopping-list" element={<ShoppingListView />} />
          </Routes>
        </div>
      </Router>
    </MealTrayProvider>
  );
}

export default App;