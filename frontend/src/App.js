import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import recipesData from './data/recipes.json';
import ingredientsPricing from './data/ingredients_pricing.json';

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
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const addRecipe = (recipeId) => {
    if (!selectedRecipes.includes(recipeId)) {
      const newRecipes = [...selectedRecipes, recipeId];
      setSelectedRecipes(newRecipes);
      calculateCost(newRecipes);
    }
  };

  const removeRecipe = (recipeId) => {
    const newRecipes = selectedRecipes.filter(id => id !== recipeId);
    setSelectedRecipes(newRecipes);
    calculateCost(newRecipes);
  };

  const calculateCost = (recipes) => {
    let totalCost = 0;
    const ingredientTotals = {};

    // Get all recipes including user-generated ones
    const allRecipes = [...recipesData, ...loadUserCookbook()];

    // Consolidate ingredients from all selected recipes
    recipes.forEach(recipeId => {
      const recipe = allRecipes.find(r => r.id === recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name;
          if (!ingredientTotals[key]) {
            ingredientTotals[key] = 0;
          }
          // Simple quantity parsing (could be more sophisticated)
          const quantity = parseFloat(ingredient.quantity) || 1;
          ingredientTotals[key] += quantity;
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
    return selectedRecipes.map(id => allRecipes.find(r => r.id === id)).filter(Boolean);
  };

  return (
    <MealTrayContext.Provider value={{
      selectedRecipes,
      estimatedCost,
      addRecipe,
      removeRecipe,
      clearTray,
      getSelectedRecipesData
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
            <h1 className="text-2xl font-bold text-primary font-lora">Homeland Meals</h1>
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
            <button className="text-gray-600 hover:text-primary transition-colors hidden md:block">About</button>
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
      
      // 1. Protein Swap (Highest Impact)
      if (ingredient.name === 'Chicken Breast' && pricing.budget_alternative) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative].price,
          swapReason: 'Protein Optimization: Chicken thighs are more flavorful and budget-friendly'
        };
      }

      // 2. Dairy Optimization
      if (ingredient.name === 'Double Cream' && pricing.budget_alternative) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative].price,
          swapReason: 'Smart Swap: Single cream works perfectly for most recipes'
        };
      }

      // 3. Grain/Staple Optimization
      if (ingredient.name === 'Basmati Rice' && pricing.budget_alternative) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative].price,
          swapReason: 'Store Brand: Same quality, better price'
        };
      }

      // 4. Oil/Fat Optimization
      if (ingredient.name === 'Vegetable Oil' && pricing.budget_alternative) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative].price,
          swapReason: 'Budget Win: Sunflower oil is cheaper and works equally well'
        };
      }

      // 5. Premium Ingredient Swaps
      if (ingredient.name === 'Paneer' && pricing.budget_alternative) {
        totalSavings += pricing.savings;
        return {
          ...ingredient,
          name: pricing.budget_alternative,
          originalName: ingredient.name,
          isSwapped: true,
          savings: pricing.savings,
          price: ingredientsPricing[pricing.budget_alternative].price,
          swapReason: 'Protein Alternative: Extra firm tofu is budget-friendly and absorbs flavors well'
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

// Components
const AddRecipeModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    servings: 4,
    cookingTime: '',
    difficulty: 'Easy',
    cuisine: 'Home Style',
    ingredients: '',
    instructions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse ingredients from textarea
    const ingredientLines = formData.ingredients.split('\n').filter(line => line.trim());
    const parsedIngredients = ingredientLines.map((line, index) => {
      // Simple parsing - could be more sophisticated
      const parts = line.trim().split(' ');
      const quantity = parts.slice(0, 2).join(' '); // First 2 words as quantity
      const name = parts.slice(2).join(' '); // Rest as ingredient name
      
      return {
        name: name || line.trim(),
        quantity: quantity || '1 portion',
        category: 'User Added'
      };
    });

    // Parse instructions from textarea
    const instructionLines = formData.instructions.split('\n').filter(line => line.trim());

    const recipe = {
      id: Date.now(), // Simple ID generation
      name: formData.name,
      description: formData.description,
      servings: parseInt(formData.servings),
      cookingTime: formData.cookingTime,
      difficulty: formData.difficulty,
      cuisine: formData.cuisine,
      ingredients: parsedIngredients,
      instructions: instructionLines,
      tags: ['Personal', 'Home Recipe'],
      userGenerated: true,
      imageUrl: '/images/user-recipe.jpg' // Placeholder
    };

    onSave(recipe);
    setFormData({
      name: '',
      description: '',
      servings: 4,
      cookingTime: '',
      difficulty: 'Easy',
      cuisine: 'Home Style',
      ingredients: '',
      instructions: ''
    });
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({...formData, servings: e.target.value})}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients 
              <span className="text-xs text-gray-500">(One ingredient per line)</span>
            </label>
            <textarea
              required
              value={formData.ingredients}
              onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="6"
              placeholder={`500g Chicken pieces\n2 tbsp Vegetable oil\n1 large Onion chopped\n3 cloves Garlic minced\n1 tsp Garam masala`}
            />
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
              Save Recipe
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4 font-lora">My Personal Cookbook</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Preserve your family's treasured recipes and never lose those precious culinary memories. 
            Add them to your meal plans and generate smart shopping lists.
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
            Add Family Recipe
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
                      {selectedRecipes.includes(recipe.id) ? 'In Tray ✓' : 'Add to Tray'}
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
  const { selectedRecipes } = useMealTray();
  const isSelected = selectedRecipes.includes(recipe.id);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <div 
        className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200"
        onClick={() => onViewRecipe(recipe.id)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl opacity-20">🍛</div>
        </div>
        <div className="absolute top-3 right-3">
          {isSelected && (
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              ✓
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 text-xs px-2 py-1 rounded-full text-gray-700">
            {recipe.cookingTime}
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
            <span className={`px-2 py-1 rounded-full ${
              recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
              recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
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

  const cuisines = ['All', ...new Set(recipesData.map(recipe => recipe.cuisine))];
  
  const filteredRecipes = recipesData.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || recipe.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const handleViewRecipe = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-lora">
            Discover Authentic South Asian Recipes
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-inter">
            Cook the food you miss from home with ingredients available at your local UK supermarket. 
            Smart meal planning made easy for students and busy professionals.
          </p>
          
          {/* Search and Filter */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {cuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
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
            <p className="text-gray-500 text-lg">No recipes found matching your search.</p>
          </div>
        )}
      </div>

      <WeeklyMealTray />
    </div>
  );
};

const RecipeDetailView = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { addRecipe, removeRecipe, selectedRecipes } = useMealTray();
  const [healthierVersion, setHealthierVersion] = useState(null);
  const [isHealthifying, setIsHealthifying] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  
  // Get recipe from both curated and user recipes
  const allRecipes = [...recipesData, ...loadUserCookbook()];
  const recipe = allRecipes.find(r => r.id === parseInt(recipeId));
  const isInTray = selectedRecipes.includes(parseInt(recipeId));

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recipe Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to Home
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
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl h-64 md:h-80 flex items-center justify-center mb-8 relative">
              <div className="text-8xl opacity-30">🍛</div>
              {healthierVersion && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✨ Healthier Version
                </div>
              )}
            </div>

            {/* Recipe Header */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-800 mb-4 font-lora">{currentRecipe.name}</h1>
              <p className="text-gray-600 mb-6 leading-relaxed">{currentRecipe.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recipe.servings}</div>
                  <div className="text-sm text-gray-500">Servings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recipe.cookingTime}</div>
                  <div className="text-sm text-gray-500">Cook Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    recipe.difficulty === 'Easy' ? 'text-green-600' :
                    recipe.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {recipe.difficulty}
                  </div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{recipe.cuisine}</div>
                  <div className="text-sm text-gray-500">Cuisine</div>
                </div>
              </div>

              {/* Health Changes Alert */}
              {healthierVersion && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">✨ AI Optimization Applied:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Optimization Strategy:</strong> Advanced Health Hierarchy Algorithm</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Cooking method optimization (reduce oil, enhance nutrients)</li>
                      <li>Smart fat source swaps (saturated → unsaturated)</li>
                      <li>Complex carbohydrate upgrades (fiber boost)</li>
                      <li>Micronutrient enhancement (vitamins & minerals)</li>
                    </ul>
                    
                    {healthierVersion.ingredients.filter(ing => ing.isSwapped || ing.isAdded).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="font-medium">Specific Changes:</p>
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
                  {isHealthifying ? '🔄 Making Healthier...' : '✨ Make it Healthier'}
                </button>
                
                <button
                  onClick={() => setShowSubstitutes(!showSubstitutes)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  🔄 Find UK Substitutes
                </button>
                
                <button
                  onClick={() => isInTray ? removeRecipe(parseInt(recipeId)) : addRecipe(parseInt(recipeId))}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                    isInTray 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {isInTray ? '✕ Remove from Week' : '+ Add to Week'}
                </button>
              </div>
            </div>

            {/* UK Substitutes */}
            {showSubstitutes && (
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 font-lora">🇬🇧 UK Supermarket Substitutes</h3>
                <div className="grid gap-4">
                  {currentRecipe.ingredients.map((ingredient, index) => {
                    const pricing = ingredientsPricing[ingredient.name];
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-gray-500 ml-2">({ingredient.quantity})</span>
                        </div>
                        {pricing && pricing.budget_alternative ? (
                          <div className="text-sm">
                            <span className="text-blue-600">Available: {pricing.budget_alternative}</span>
                            <span className="text-green-600 ml-2">(Save £{pricing.savings?.toFixed(2)})</span>
                          </div>
                        ) : (
                          <span className="text-green-600 text-sm">✓ Available at Tesco/Asda</span>
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
                      <span className={ingredient.isSwapped ? 'text-green-600 font-medium' : ''}>
                        {ingredient.quantity} {ingredient.name}
                        {ingredient.isSwapped && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
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
                      <span className="text-gray-700 leading-relaxed">{instruction}</span>
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
  const { selectedRecipes, getSelectedRecipesData, clearTray } = useMealTray();
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

      // Consolidate ingredients
      selectedRecipesData.forEach(recipe => {
        recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name;
          if (!consolidatedIngredients[key]) {
            consolidatedIngredients[key] = {
              name: ingredient.name,
              category: ingredient.category || 'User Added',
              totalQuantity: ingredient.quantity,
              recipes: [recipe.name],
              price: ingredientsPricing[ingredient.name]?.price || 0,
              unit: ingredientsPricing[ingredient.name]?.unit || 'item'
            };
          } else {
            consolidatedIngredients[key].recipes.push(recipe.name);
            // In a real app, we'd properly add quantities with unit conversion
            consolidatedIngredients[key].totalQuantity += ` + ${ingredient.quantity}`;
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

  if (selectedRecipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Recipes Selected</h2>
          <p className="text-gray-600 mb-6">Add some recipes to your weekly tray first!</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Browse Recipes
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
          className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          ← Back to Recipes
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 font-lora">Your Weekly Shopping List</h1>
            <p className="text-gray-600">Optimized for UK supermarkets • Perfect for Loughborough students</p>
          </div>

          {isGenerating ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Generating Your Shopping List</h3>
              <p className="text-gray-600">Consolidating ingredients and calculating costs...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{shoppingList.recipes.length}</div>
                    <div className="text-sm text-gray-500">Recipes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{shoppingList.totalItems}</div>
                    <div className="text-sm text-gray-500">Ingredients</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isOptimized ? 'text-green-600' : 'text-primary'}`}>
                      £{shoppingList.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isOptimized ? 'Optimized Total' : 'Estimated Total'}
                    </div>
                  </div>
                  <div>
                    {isOptimized && shoppingList.totalSavings > 0 ? (
                      <>
                        <div className="text-2xl font-bold text-green-600">£{shoppingList.totalSavings.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Total Savings</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-orange-600">Student</div>
                        <div className="text-sm text-gray-500">Budget Friendly</div>
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
                      {isOptimizing ? '🔄 Optimizing...' : '💰 My budget is tight. Optimize it!'}
                    </button>
                  </div>
                )}

                {isOptimized && shoppingList.originalCost && (
                  <div className="mt-4 text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                      <span className="text-green-800 font-medium">
                        💚 Optimized! You'll save £{shoppingList.totalSavings.toFixed(2)} 
                        (was £{shoppingList.originalCost.toFixed(2)})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Recipes */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h3 className="font-semibold mb-4 font-lora">Recipes in Your Weekly Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shoppingList.recipes.map(recipe => (
                    <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🍛</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{recipe.name}</h4>
                        <p className="text-xs text-gray-500">{recipe.servings} servings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping List by Category */}
              <div className="space-y-6">
                {Object.entries(shoppingList.categories).map(([category, ingredients]) => (
                  <div key={category} className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 font-lora flex items-center">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        {ingredients.length}
                      </span>
                      {category}
                    </h3>
                    
                    <div className="space-y-3">
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          ingredient.isSwapped ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="mr-3 w-4 h-4 text-primary"
                            />
                            <div>
                              <div className="font-medium">
                                {ingredient.name}
                                {ingredient.isSwapped && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    SWAPPED: {ingredient.originalName} → {ingredient.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ingredient.totalQuantity}
                                {ingredient.recipes.length > 1 && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    Used in {ingredient.recipes.length} recipes
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium">£{ingredient.price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{ingredient.unit}</div>
                            {ingredient.isSwapped && ingredient.savings && (
                              <div className="text-xs text-green-600 font-medium">
                                Save £{ingredient.savings.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
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
                  🖨️ Print Shopping List
                </button>
                
                <button
                  onClick={clearTray}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  🗑️ Clear Meal Tray
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  ➕ Add More Recipes
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 font-lora">About Homeland Meals</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bridging cultures through technology - where artificial intelligence meets authentic South Asian cuisine
          </p>
        </div>

        {/* App Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 font-lora">The Story Behind Homeland Meals</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Homeland Meals was born from a simple yet profound observation: millions of South Asian diaspora 
                members struggle to recreate the authentic flavors of home while adapting to local ingredients 
                and tight budgets.
              </p>
              <p>
                Our AI-powered platform solves this challenge by combining traditional recipe wisdom with 
                cutting-edge technology, creating personalized meal planning experiences that honor culinary 
                heritage while embracing modern convenience.
              </p>
              <p>
                From Birmingham to Manchester, from London to Edinburgh, Homeland Meals helps preserve family 
                recipes while making them accessible for the next generation of busy students and professionals.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8">
            <h3 className="text-xl font-semibold mb-4 font-lora">Our Mission</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">🏠</span>
                <span><strong>Preserve Heritage:</strong> Digitally safeguard family recipes for future generations</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">🧠</span>
                <span><strong>Smart Adaptation:</strong> Use AI to make traditional recipes healthier and budget-friendly</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">🛒</span>
                <span><strong>Local Integration:</strong> Connect authentic ingredients with UK supermarket availability</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">🌍</span>
                <span><strong>Cultural Bridge:</strong> Help diaspora communities maintain culinary connections to home</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
          <h2 className="text-2xl font-semibold mb-6 font-lora text-center">Advanced AI Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">Health Optimization Engine</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• <strong>Cooking Method Analysis:</strong> Transforms deep-frying to air-frying techniques</li>
                <li>• <strong>Fat Source Intelligence:</strong> Swaps saturated fats for heart-healthy alternatives</li>
                <li>• <strong>Carbohydrate Upgrading:</strong> Enhances fiber content with complex carbs</li>
                <li>• <strong>Micronutrient Boosting:</strong> Adds vitamins and minerals while preserving taste</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Budget Optimization Intelligence</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• <strong>Protein Strategy:</strong> Identifies cost-effective protein alternatives</li>
                <li>• <strong>Brand Intelligence:</strong> Suggests store-brand equivalents without quality loss</li>
                <li>• <strong>Form Factor Analysis:</strong> Recommends whole ingredients over processed versions</li>
                <li>• <strong>Seasonal Awareness:</strong> Factors in UK seasonal pricing variations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Creator Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-semibold mb-8 font-lora text-center">Meet the Creator</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image & Basic Info */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl text-white font-bold">TD</span>
              </div>
              <h3 className="text-xl font-semibold font-lora">Tamoghna Das</h3>
              <p className="text-gray-600 mb-4">PhD Researcher & AI Innovation Leader</p>
              <div className="flex justify-center space-x-3">
                <a href="https://github.com/Tamoghna12" className="text-gray-600 hover:text-primary transition-colors">
                  <span className="text-2xl">📱</span>
                </a>
                <a href="https://www.linkedin.com/in/tamoghnadas12" className="text-gray-600 hover:text-primary transition-colors">
                  <span className="text-2xl">💼</span>
                </a>
                <a href="mailto:tamoghnadas.12@outlook.com" className="text-gray-600 hover:text-primary transition-colors">
                  <span className="text-2xl">📧</span>
                </a>
              </div>
            </div>

            {/* Academic & Professional Background */}
            <div>
              <h4 className="font-semibold mb-3 text-primary">Academic Excellence</h4>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li>🎓 <strong>PhD Chemical Engineering</strong> - Loughborough University, UK</li>
                <li>🧬 <strong>MSc Biochemical Engineering</strong> - UCL London, UK</li>
                <li>📊 <strong>MSc Data Science</strong> - UEA Norwich, UK</li>
                <li>🧪 <strong>BTech Biotechnology</strong> - VIT Vellore, India</li>
              </ul>
              
              <h4 className="font-semibold mb-3 text-primary">Research Focus</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• AI applications in biological systems</li>
                <li>• Machine learning for healthcare</li>
                <li>• Bioinformatics pipeline development</li>
                <li>• Systems biology & genomics</li>
              </ul>
            </div>

            {/* Impact & Achievements */}
            <div>
              <h4 className="font-semibold mb-3 text-primary">Impact & Recognition</h4>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li>👨‍🏫 <strong>100+ Students Trained</strong> in AI/Data Science (>94% satisfaction)</li>
                <li>🏆 <strong>Bio-Inspired Design Winner</strong> - National Competition India</li>
                <li>🧬 <strong>Chem-a-Thon Champion</strong> - Chemical Engineering Hackathon</li>
                <li>🌍 <strong>ICID Hackathon</strong> - International recognition, Buenos Aires</li>
              </ul>
              
              <h4 className="font-semibold mb-3 text-primary">Technical Expertise</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Python</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">AI/ML</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">React</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Bioinformatics</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Cloud Computing</span>
              </div>
            </div>
          </div>

          {/* Personal Connection */}
          <div className="mt-8 p-6 bg-white rounded-lg">
            <h4 className="font-semibold mb-3 font-lora">Why Homeland Meals?</h4>
            <p className="text-gray-700 text-sm italic">
              "As a researcher living away from home, I understand the deep connection between food and cultural identity. 
              Homeland Meals represents the intersection of my technical expertise in AI and my personal journey as part 
              of the diaspora community. By combining cutting-edge machine learning with traditional culinary wisdom, 
              we're not just creating recipes - we're preserving heritage and building bridges between cultures."
            </p>
            <p className="text-gray-600 text-xs mt-3">— Tamoghna Das, Founder & AI Architect</p>
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

function App() {
  return (
    <MealTrayProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/recipe/:recipeId" element={<RecipeDetailView />} />
            <Route path="/cookbook" element={<PersonalCookbookView />} />
            <Route path="/shopping-list" element={<ShoppingListView />} />
          </Routes>
        </div>
      </Router>
    </MealTrayProvider>
  );
}

export default App;