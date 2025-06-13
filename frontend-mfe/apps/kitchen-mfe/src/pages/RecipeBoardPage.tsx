import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number;
  temperature?: number;
  notes?: string;
  image?: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  allergens?: string[];
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  station: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  allergens: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  lastUpdated: string;
  chef: string;
  image?: string;
  isActive: boolean;
}

const RecipeBoardPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  // Mock recipe data
  useEffect(() => {
    const mockRecipes: Recipe[] = [
      {
        id: 'recipe_grilled_salmon',
        name: 'Grilled Salmon with Lemon Herbs',
        category: 'Main Course',
        station: 'grill',
        difficulty: 'medium',
        prepTime: 10,
        cookTime: 15,
        totalTime: 25,
        servings: 1,
        description: 'Fresh Atlantic salmon grilled to perfection with aromatic herbs and lemon zest.',
        ingredients: [
          { id: 'ing_1', name: 'Salmon Fillet', quantity: 6, unit: 'oz', allergens: ['Fish'] },
          { id: 'ing_2', name: 'Lemon', quantity: 0.5, unit: 'whole', notes: 'For zest and juice' },
          { id: 'ing_3', name: 'Fresh Dill', quantity: 1, unit: 'tbsp', notes: 'Chopped' },
          { id: 'ing_4', name: 'Olive Oil', quantity: 2, unit: 'tbsp' },
          { id: 'ing_5', name: 'Salt', quantity: 1, unit: 'tsp' },
          { id: 'ing_6', name: 'Black Pepper', quantity: 0.5, unit: 'tsp' },
          { id: 'ing_7', name: 'Garlic', quantity: 2, unit: 'cloves', notes: 'Minced' }
        ],
        steps: [
          {
            id: 'step_1',
            stepNumber: 1,
            instruction: 'Remove salmon from refrigeration 15 minutes before cooking to bring to room temperature.',
            duration: 15,
            notes: 'This ensures even cooking'
          },
          {
            id: 'step_2',
            stepNumber: 2,
            instruction: 'Preheat grill to medium-high heat (400-450°F).',
            duration: 5,
            temperature: 425
          },
          {
            id: 'step_3',
            stepNumber: 3,
            instruction: 'Pat salmon dry with paper towels. Season both sides with salt and pepper.',
            duration: 2
          },
          {
            id: 'step_4',
            stepNumber: 4,
            instruction: 'Mix olive oil, minced garlic, lemon zest, and fresh dill in a small bowl.',
            duration: 3
          },
          {
            id: 'step_5',
            stepNumber: 5,
            instruction: 'Brush salmon with herb oil mixture on both sides.',
            duration: 1
          },
          {
            id: 'step_6',
            stepNumber: 6,
            instruction: 'Grill salmon skin-side down for 6-8 minutes. DO NOT flip too early.',
            duration: 7,
            notes: 'Look for grill marks and fish should release easily'
          },
          {
            id: 'step_7',
            stepNumber: 7,
            instruction: 'Flip carefully and grill for another 4-6 minutes until internal temp reaches 145°F.',
            duration: 5,
            temperature: 145,
            notes: 'Fish should flake easily with fork'
          },
          {
            id: 'step_8',
            stepNumber: 8,
            instruction: 'Remove from grill and let rest for 2 minutes. Squeeze fresh lemon juice over top.',
            duration: 2
          }
        ],
        allergens: ['Fish'],
        nutritionalInfo: {
          calories: 420,
          protein: 35,
          carbs: 2,
          fat: 28
        },
        tags: ['Grilled', 'Healthy', 'Protein', 'Fish', 'Mediterranean'],
        lastUpdated: new Date().toISOString(),
        chef: 'Chef Marco Rodriguez',
        isActive: true
      },
      {
        id: 'recipe_caesar_salad',
        name: 'Classic Caesar Salad',
        category: 'Salad',
        station: 'salad',
        difficulty: 'easy',
        prepTime: 15,
        cookTime: 0,
        totalTime: 15,
        servings: 1,
        description: 'Traditional Caesar salad with house-made dressing and fresh parmesan.',
        ingredients: [
          { id: 'ing_8', name: 'Romaine Lettuce', quantity: 1, unit: 'head', notes: 'Washed and chopped' },
          { id: 'ing_9', name: 'Caesar Dressing', quantity: 3, unit: 'tbsp', notes: 'House-made' },
          { id: 'ing_10', name: 'Parmesan Cheese', quantity: 2, unit: 'tbsp', notes: 'Freshly grated', allergens: ['Dairy'] },
          { id: 'ing_11', name: 'Croutons', quantity: 0.25, unit: 'cup', allergens: ['Gluten'] },
          { id: 'ing_12', name: 'Lemon Wedge', quantity: 1, unit: 'piece' }
        ],
        steps: [
          {
            id: 'step_9',
            stepNumber: 1,
            instruction: 'Wash romaine lettuce thoroughly and spin dry. Chop into bite-sized pieces.',
            duration: 5
          },
          {
            id: 'step_10',
            stepNumber: 2,
            instruction: 'Place lettuce in large mixing bowl. Add Caesar dressing and toss gently.',
            duration: 2
          },
          {
            id: 'step_11',
            stepNumber: 3,
            instruction: 'Add croutons and half the parmesan cheese. Toss again.',
            duration: 1
          },
          {
            id: 'step_12',
            stepNumber: 4,
            instruction: 'Transfer to serving plate. Top with remaining parmesan and lemon wedge.',
            duration: 2
          }
        ],
        allergens: ['Dairy', 'Gluten'],
        nutritionalInfo: {
          calories: 280,
          protein: 8,
          carbs: 12,
          fat: 22
        },
        tags: ['Salad', 'Vegetarian', 'Classic', 'Quick'],
        lastUpdated: new Date().toISOString(),
        chef: 'Chef Lisa Martinez',
        isActive: true
      },
      {
        id: 'recipe_chicken_burger',
        name: 'Grilled Chicken Burger',
        category: 'Burger',
        station: 'grill',
        difficulty: 'medium',
        prepTime: 15,
        cookTime: 12,
        totalTime: 27,
        servings: 1,
        description: 'Juicy grilled chicken breast with house seasonings on a brioche bun.',
        ingredients: [
          { id: 'ing_13', name: 'Chicken Breast', quantity: 6, unit: 'oz' },
          { id: 'ing_14', name: 'Brioche Bun', quantity: 1, unit: 'whole', allergens: ['Gluten', 'Dairy', 'Eggs'] },
          { id: 'ing_15', name: 'Lettuce', quantity: 2, unit: 'leaves' },
          { id: 'ing_16', name: 'Tomato', quantity: 2, unit: 'slices' },
          { id: 'ing_17', name: 'Red Onion', quantity: 2, unit: 'slices' },
          { id: 'ing_18', name: 'Mayo', quantity: 1, unit: 'tbsp', allergens: ['Eggs'] },
          { id: 'ing_19', name: 'Chicken Seasoning', quantity: 1, unit: 'tsp', notes: 'House blend' }
        ],
        steps: [
          {
            id: 'step_13',
            stepNumber: 1,
            instruction: 'Pound chicken breast to even 3/4 inch thickness.',
            duration: 3
          },
          {
            id: 'step_14',
            stepNumber: 2,
            instruction: 'Season both sides with house chicken seasoning.',
            duration: 2
          },
          {
            id: 'step_15',
            stepNumber: 3,
            instruction: 'Preheat grill to medium-high heat.',
            duration: 5,
            temperature: 400
          },
          {
            id: 'step_16',
            stepNumber: 4,
            instruction: 'Grill chicken 6 minutes per side until internal temp reaches 165°F.',
            duration: 12,
            temperature: 165
          },
          {
            id: 'step_17',
            stepNumber: 5,
            instruction: 'Toast brioche bun on grill for 1 minute.',
            duration: 1
          },
          {
            id: 'step_18',
            stepNumber: 6,
            instruction: 'Spread mayo on bottom bun. Layer lettuce, tomato, chicken, onion, and top bun.',
            duration: 2
          }
        ],
        allergens: ['Gluten', 'Dairy', 'Eggs'],
        nutritionalInfo: {
          calories: 520,
          protein: 42,
          carbs: 35,
          fat: 22
        },
        tags: ['Grilled', 'Burger', 'Protein', 'Popular'],
        lastUpdated: new Date().toISOString(),
        chef: 'Chef Sarah Chen',
        isActive: true
      },
      {
        id: 'recipe_tiramisu',
        name: 'Classic Tiramisu',
        category: 'Dessert',
        station: 'dessert',
        difficulty: 'hard',
        prepTime: 30,
        cookTime: 0,
        totalTime: 30,
        servings: 1,
        description: 'Traditional Italian tiramisu with espresso-soaked ladyfingers and mascarpone cream.',
        ingredients: [
          { id: 'ing_20', name: 'Ladyfinger Cookies', quantity: 4, unit: 'pieces', allergens: ['Gluten', 'Eggs'] },
          { id: 'ing_21', name: 'Mascarpone', quantity: 3, unit: 'oz', allergens: ['Dairy'] },
          { id: 'ing_22', name: 'Heavy Cream', quantity: 2, unit: 'tbsp', allergens: ['Dairy'] },
          { id: 'ing_23', name: 'Sugar', quantity: 1, unit: 'tbsp' },
          { id: 'ing_24', name: 'Espresso', quantity: 0.25, unit: 'cup', notes: 'Cooled' },
          { id: 'ing_25', name: 'Cocoa Powder', quantity: 1, unit: 'tsp', notes: 'For dusting' },
          { id: 'ing_26', name: 'Dark Rum', quantity: 1, unit: 'tsp', notes: 'Optional' }
        ],
        steps: [
          {
            id: 'step_19',
            stepNumber: 1,
            instruction: 'Whip heavy cream to soft peaks. Set aside.',
            duration: 3
          },
          {
            id: 'step_20',
            stepNumber: 2,
            instruction: 'Mix mascarpone and sugar until smooth.',
            duration: 2
          },
          {
            id: 'step_21',
            stepNumber: 3,
            instruction: 'Gently fold whipped cream into mascarpone mixture.',
            duration: 2
          },
          {
            id: 'step_22',
            stepNumber: 4,
            instruction: 'Combine espresso and rum in shallow dish.',
            duration: 1
          },
          {
            id: 'step_23',
            stepNumber: 5,
            instruction: 'Quickly dip each ladyfinger in espresso mixture. Do not oversoak.',
            duration: 3,
            notes: '1-2 seconds per cookie'
          },
          {
            id: 'step_24',
            stepNumber: 6,
            instruction: 'Layer dipped cookies in serving dish.',
            duration: 2
          },
          {
            id: 'step_25',
            stepNumber: 7,
            instruction: 'Spread mascarpone mixture over cookies.',
            duration: 3
          },
          {
            id: 'step_26',
            stepNumber: 8,
            instruction: 'Dust with cocoa powder before serving.',
            duration: 1
          }
        ],
        allergens: ['Gluten', 'Eggs', 'Dairy'],
        nutritionalInfo: {
          calories: 380,
          protein: 6,
          carbs: 28,
          fat: 26
        },
        tags: ['Dessert', 'Italian', 'Coffee', 'Classic'],
        lastUpdated: new Date().toISOString(),
        chef: 'Chef Emma Thompson',
        isActive: true
      }
    ];
    setRecipes(mockRecipes);

    // If itemId is provided, show that recipe in detail view
    if (itemId) {
      const recipe = mockRecipes.find(r => r.id === itemId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setViewMode('detail');
      }
    }
  }, [itemId]);

  const filteredRecipes = recipes.filter(recipe => {
    if (!recipe.isActive) return false;
    if (searchTerm && !recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !recipe.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    if (selectedStation !== 'all' && recipe.station !== selectedStation) return false;
    if (selectedCategory !== 'all' && recipe.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(recipes.map(r => r.category)));

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setViewMode('detail');
    navigate(`/recipes/${recipe.id}`);
  };

  const handleBackToGrid = () => {
    setSelectedRecipe(null);
    setViewMode('grid');
    navigate('/recipes');
  };

  const renderRecipeGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRecipes.map((recipe) => (
        <div
          key={recipe.id}
          onClick={() => handleRecipeSelect(recipe)}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300"
        >
          {/* Recipe Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`station-indicator ${recipe.station}`}></span>
              <span className="text-sm font-medium text-neutral-600 capitalize">{recipe.station}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>

          <h3 className="font-semibold text-neutral-900 mb-2">{recipe.name}</h3>
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{recipe.description}</p>

          {/* Recipe Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="text-center">
              <div className="font-semibold text-neutral-900">{recipe.prepTime}m</div>
              <div className="text-neutral-600">Prep</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-neutral-900">{recipe.cookTime}m</div>
              <div className="text-neutral-600">Cook</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-neutral-900">{recipe.totalTime}m</div>
              <div className="text-neutral-600">Total</div>
            </div>
          </div>

          {/* Category and Tags */}
          <div className="mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
              {recipe.category}
            </span>
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="inline-block bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded mr-1">
                {tag}
              </span>
            ))}
          </div>

          {/* Allergens */}
          {recipe.allergens.length > 0 && (
            <div className="text-xs text-red-600">
              <span className="font-medium">Allergens:</span> {recipe.allergens.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderRecipeDetail = () => {
    if (!selectedRecipe) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        {/* Recipe Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`station-indicator ${selectedRecipe.station}`}></span>
              <h1 className="text-2xl font-bold text-neutral-900">{selectedRecipe.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                {selectedRecipe.difficulty}
              </span>
            </div>
            <p className="text-neutral-600">{selectedRecipe.description}</p>
            <div className="text-sm text-neutral-500 mt-2">
              By {selectedRecipe.chef} • Updated {new Date(selectedRecipe.lastUpdated).toLocaleDateString()}
            </div>
          </div>
          <Button onClick={handleBackToGrid} variant="outline">
            ← Back to Recipes
          </Button>
        </div>

        {/* Recipe Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="performance-metric">
            <div className="metric-value">{selectedRecipe.prepTime}m</div>
            <div className="metric-label">Prep Time</div>
          </div>
          <div className="performance-metric">
            <div className="metric-value">{selectedRecipe.cookTime}m</div>
            <div className="metric-label">Cook Time</div>
          </div>
          <div className="performance-metric">
            <div className="metric-value">{selectedRecipe.totalTime}m</div>
            <div className="metric-label">Total Time</div>
          </div>
          <div className="performance-metric">
            <div className="metric-value">{selectedRecipe.servings}</div>
            <div className="metric-label">Servings</div>
          </div>
        </div>

        {/* Allergens and Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {selectedRecipe.allergens.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Allergens</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRecipe.allergens.map((allergen) => (
                  <span key={allergen} className="bg-red-200 text-red-800 text-sm px-2 py-1 rounded">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedRecipe.nutritionalInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Nutrition (per serving)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {selectedRecipe.nutritionalInfo.calories}</div>
                <div>Protein: {selectedRecipe.nutritionalInfo.protein}g</div>
                <div>Carbs: {selectedRecipe.nutritionalInfo.carbs}g</div>
                <div>Fat: {selectedRecipe.nutritionalInfo.fat}g</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ingredients</h3>
            <div className="space-y-3">
              {selectedRecipe.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div>
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.notes && (
                      <div className="text-sm text-neutral-600">({ingredient.notes})</div>
                    )}
                    {ingredient.allergens && ingredient.allergens.length > 0 && (
                      <div className="text-xs text-red-600">
                        Allergens: {ingredient.allergens.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-neutral-900">
                    {ingredient.quantity} {ingredient.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Instructions</h3>
            <div className="space-y-4">
              {selectedRecipe.steps.map((step) => (
                <div key={step.id} className="flex space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-900 mb-1">{step.instruction}</p>
                    <div className="flex items-center space-x-4 text-xs text-neutral-600">
                      {step.duration && (
                        <span className="bg-neutral-100 px-2 py-1 rounded">
                          ⏱️ {step.duration}m
                        </span>
                      )}
                      {step.temperature && (
                        <span className="bg-neutral-100 px-2 py-1 rounded">
                          🌡️ {step.temperature}°F
                        </span>
                      )}
                    </div>
                    {step.notes && (
                      <div className="text-sm text-blue-600 mt-1 italic">
                        💡 {step.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-medium text-neutral-700 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {selectedRecipe.tags.map((tag) => (
              <span key={tag} className="bg-neutral-100 text-neutral-700 text-sm px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Recipe Board</h1>
          <p className="text-neutral-600">
            {viewMode === 'grid' 
              ? `${filteredRecipes.length} recipes available`
              : selectedRecipe?.name
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {viewMode === 'grid' && (
            <>
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Stations</option>
                <option value="grill">Grill</option>
                <option value="prep">Prep</option>
                <option value="salad">Salad</option>
                <option value="dessert">Dessert</option>
                <option value="drinks">Drinks</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </>
          )}

          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Back to Queue
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? renderRecipeGrid() : renderRecipeDetail()}

      {viewMode === 'grid' && filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No recipes found</div>
          <div className="text-neutral-500 text-sm">
            {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeBoardPage;