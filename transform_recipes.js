// Script to transform recipes.json to new schema with structured quantities
const fs = require('fs');

// Read the current recipes.json
const recipes = JSON.parse(fs.readFileSync('/app/frontend/src/data/recipes.json', 'utf8'));

// Helper function to parse quantity strings into structured format
function parseQuantity(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') {
    return { quantity: null, unit: 'to taste' };
  }

  // Handle common patterns
  const patterns = [
    // Weight: "500g", "250g", etc.
    { regex: /^(\d+(?:\.\d+)?)\s*g$/, unit: 'g' },
    { regex: /^(\d+(?:\.\d+)?)\s*kg$/, multiplier: 1000, unit: 'g' },
    
    // Volume: "200ml", "150ml", etc.
    { regex: /^(\d+(?:\.\d+)?)\s*ml$/, unit: 'ml' },
    { regex: /^(\d+(?:\.\d+)?)\s*l$/, multiplier: 1000, unit: 'ml' },
    
    // Teaspoons/Tablespoons: "2 tsp", "3 tbsp"
    { regex: /^(\d+(?:\.\d+)?)\s*tsp$/, unit: 'tsp' },
    { regex: /^(\d+(?:\/\d+)?)\s*tsp$/, unit: 'tsp' }, // Handle fractions like "1/2 tsp"
    { regex: /^(\d+(?:\.\d+)?)\s*tbsp$/, unit: 'tbsp' },
    { regex: /^(\d+(?:\/\d+)?)\s*tbsp$/, unit: 'tbsp' },
    
    // Cups: "2 cups", "1 cup"
    { regex: /^(\d+(?:\.\d+)?)\s*cups?$/, unit: 'cups' },
    
    // Simple numbers: "2", "4", "6 cloves", "3 large", etc.
    { regex: /^(\d+)\s*cloves?$/, unit: 'cloves' },
    { regex: /^(\d+)\s*large$/, unit: 'large' },
    { regex: /^(\d+)\s*medium$/, unit: 'medium' },
    { regex: /^(\d+)\s*small$/, unit: 'small' },
    { regex: /^(\d+)\s*leaves?$/, unit: 'leaves' },
    { regex: /^(\d+)$/, unit: 'pieces' },
    
    // Inch pieces: "2 inch piece", "1 inch piece"
    { regex: /^(\d+(?:\.\d+)?)\s*inch\s*pieces?$/, unit: 'inch pieces' },
  ];

  // Try to match each pattern
  for (const pattern of patterns) {
    const match = quantityStr.match(pattern.regex);
    if (match) {
      let quantity = match[1];
      
      // Handle fractions
      if (quantity.includes('/')) {
        const [num, den] = quantity.split('/');
        quantity = parseFloat(num) / parseFloat(den);
      } else {
        quantity = parseFloat(quantity);
      }
      
      // Apply multiplier if needed (e.g., kg to g)
      if (pattern.multiplier) {
        quantity *= pattern.multiplier;
      }
      
      return { quantity: quantity, unit: pattern.unit };
    }
  }

  // If no pattern matches, treat as descriptive quantity
  return { quantity: null, unit: quantityStr };
}

// Transform each recipe
const transformedRecipes = recipes.map(recipe => {
  const transformedRecipe = {
    ...recipe,
    baseServings: recipe.servings, // Add new baseServings field
    ingredients: recipe.ingredients.map(ingredient => ({
      name: ingredient.name,
      ...parseQuantity(ingredient.quantity),
      category: ingredient.category
    }))
  };
  
  return transformedRecipe;
});

// Write the transformed recipes back to the file
fs.writeFileSync('/app/frontend/src/data/recipes.json', JSON.stringify(transformedRecipes, null, 2));

console.log('Recipes transformation completed!');
console.log(`Transformed ${transformedRecipes.length} recipes`);

// Show a sample transformation for verification
console.log('\nSample transformation (first recipe):');
console.log('Original first ingredient:', recipes[0].ingredients[0]);
console.log('Transformed first ingredient:', transformedRecipes[0].ingredients[0]);