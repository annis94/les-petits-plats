// Variable globale pour stocker les données des recettes
let recipesData = [];

// Chargement des données à partir d'un fichier JSON externe contenant les recettes
fetch('recipes.json')
    .then(response => response.json())
    .then(data => {
        console.log("Données reçues :", data);
        recipesData = data;
        displayRecipes(recipesData);
        const filters = extractFilters(recipesData);
        populateFilters(filters);
    })
    .catch(error => {
        console.error('Erreur lors du chargement des recettes :', error);
    });

// Récupération de l'élément HTML où les cartes de recettes seront affichées
const recipeContainer = document.getElementById('recipe-cards-container');

// Fonction pour afficher les recettes sur la page
function displayRecipes(recipes) {
    recipeContainer.innerHTML = '';
    const recipeCountElement = document.getElementById('recipe-count');
    recipeCountElement.textContent = `${recipes.length} recette${recipes.length > 1 ? 's' : ''}`;

    if (recipes.length === 0) {
        recipeContainer.innerHTML = `<p class="text-center text-gray-600">Aucune recette ne contient "${searchBar.value}". Essayez un autre mot-clé comme "poulet" ou "chocolat".</p>`;
        return;
    }

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const imageUrl = `img/Recette${recipe.id.toString().padStart(2, '0')}.jpg`;
        let ingredientsList = '';
        
        // Construction manuelle de la liste d'ingrédients
        for (let j = 0; j < recipe.ingredients.length; j++) {
            ingredientsList += `<li>${recipe.ingredients[j].ingredient}</li>`;
        }
        
        const recipeCard = `
           <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-full max-w-sm">
               <div class="relative">
                   <img src="${imageUrl}" alt="${recipe.name}" class="w-full h-60 object-cover rounded-t-lg" />
                   <span class="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">${recipe.time} min</span>
               </div>
               <div class="p-5 flex flex-col flex-1">
                   <h3 class="text-lg font-bold mb-2">${recipe.name}</h3>
                   <p class="text-sm text-gray-600 mb-4"><strong>RECETTE</strong><br>${recipe.description}</p>
                   <p class="text-sm font-semibold mb-2"><strong>INGRÉDIENTS</strong></p>
                   <ul class="text-sm grid grid-cols-2 gap-x-4 gap-y-1">${ingredientsList}</ul>
               </div>
           </div>`;
        recipeContainer.innerHTML += recipeCard;
    }
}

// Fonction de recherche avancée combinant plusieurs filtres
function filterRecipesByTags(recipes, selectedIngredients, selectedAppliances, selectedUstensils) {
    const filteredRecipes = [];
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        
        let hasAllIngredients = true;
        for (let j = 0; j < selectedIngredients.length; j++) {
            const tag = selectedIngredients[j];
            if (!recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizeText(tag)))) {
                hasAllIngredients = false;
                break;
            }
        }
        
        const hasSelectedAppliance = selectedAppliances.length === 0 || selectedAppliances.includes(normalizeText(recipe.appliance));
        
        let hasAllUstensils = true;
        for (let k = 0; k < selectedUstensils.length; k++) {
            const tag = selectedUstensils[k];
            if (!recipe.ustensils.some(ust => normalizeText(ust).includes(normalizeText(tag)))) {
                hasAllUstensils = false;
                break;
            }
        }
        
        if (hasAllIngredients && hasSelectedAppliance && hasAllUstensils) {
            filteredRecipes.push(recipe);
        }
    }
    return filteredRecipes;
}

// Fonction pour filtrer les recettes en fonction de la recherche textuelle
function filterRecipesByText(recipes, query) {
    const normalizedQuery = normalizeText(query);
    const filteredRecipes = [];
    
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const matchesQuery = (
            normalizeText(recipe.name).includes(normalizedQuery) ||
            recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizedQuery)) ||
            normalizeText(recipe.description).includes(normalizedQuery)
        );

        if (matchesQuery) {
            filteredRecipes.push(recipe);
        }
    }
    return filteredRecipes;
}

// Fonction pour extraire les filtres des recettes
function extractFilters(recipes) {
    const ingredients = new Set();
    const appareils = new Set();
    const ustensiles = new Set();
    
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        
        for (let j = 0; j < recipe.ingredients.length; j++) {
            ingredients.add(recipe.ingredients[j].ingredient.toLowerCase());
        }
        appareils.add(recipe.appliance.toLowerCase());
        
        for (let k = 0; k < recipe.ustensils.length; k++) {
            ustensiles.add(recipe.ustensils[k].toLowerCase());
        }
    }
    return { ingredients, appareils, ustensiles };
}

// Fonction pour remplir les filtres dynamiquement
function populateFilters(filters) {
    ingredientFilter.innerHTML = '<option value="">Ingrédients</option>'; 
    appareilFilter.innerHTML = '<option value="">Appareils</option>';
    ustensileFilter.innerHTML = '<option value="">Ustensiles</option>';
    
    for (const ing of filters.ingredients) {
        ingredientFilter.innerHTML += `<option value="${ing}">${ing}</option>`;
    }
    for (const app of filters.appareils) {
        appareilFilter.innerHTML += `<option value="${app}">${app}</option>`;
    }
    for (const ust of filters.ustensiles) {
        ustensileFilter.innerHTML += `<option value="${ust}">${ust}</option>`;
    }
}

// Fonction de normalisation du texte pour gérer les variations d'orthographe et d'accentuation
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "");
}
