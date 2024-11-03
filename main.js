// Variables globales pour stocker les données et les tags sélectionnés
let recipesData = [];
let selectedTags = { ingredients: [], appliances: [], utensils: [] };

// Récupération des éléments du DOM
const ingredientFilter = document.getElementById('ingredient-filter');
const appareilFilter = document.getElementById('appareil-filter');
const ustensileFilter = document.getElementById('ustensile-filter');
const searchBar = document.getElementById('search-bar');
const recipeContainer = document.getElementById('recipe-cards-container');
const recipeCountElement = document.getElementById('recipe-count');
const selectedTagsContainer = document.getElementById('selected-tags');

// Chargement des données depuis le fichier JSON
fetch('recipes.json')
    .then(response => response.json())
    .then(data => {
        recipesData = data;
        updateDisplay();
    })
    .catch(error => {
        console.error('Erreur lors du chargement des recettes :', error);
    });

// Fonction principale pour mettre à jour l'affichage des recettes et des filtres
function updateDisplay() {
    const query = searchBar.value.trim();
    let filteredRecipes = filterRecipesByText(recipesData, query);
    filteredRecipes = filterRecipesByTags(filteredRecipes, selectedTags.ingredients, selectedTags.appliances, selectedTags.utensils);
    displayRecipes(filteredRecipes);
    const filters = extractFilters(filteredRecipes);
    populateFilters(filters);
    displaySelectedTags();
}

// Écouteurs pour la barre de recherche et les filtres
searchBar.addEventListener('input', function() {
    if (searchBar.value.length >= 3 || searchBar.value.length === 0) {
        updateDisplay();
    }
});

ingredientFilter.addEventListener('change', function() {
    const ingredient = ingredientFilter.value;
    if (ingredient && selectedTags.ingredients.indexOf(ingredient) === -1) {
        selectedTags.ingredients.push(ingredient);
        updateDisplay();
    }
});

appareilFilter.addEventListener('change', function() {
    const appliance = appareilFilter.value;
    if (appliance && selectedTags.appliances.indexOf(appliance) === -1) {
        selectedTags.appliances.push(appliance);
        updateDisplay();
    }
});

ustensileFilter.addEventListener('change', function() {
    const utensil = ustensileFilter.value;
    if (utensil && selectedTags.utensils.indexOf(utensil) === -1) {
        selectedTags.utensils.push(utensil);
        updateDisplay();
    }
});

// Fonction pour afficher les tags sélectionnés
function displaySelectedTags() {
    selectedTagsContainer.innerHTML = ''; // Vide le conteneur pour actualiser les tags
    for (let category in selectedTags) {
        selectedTags[category].forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'bg-yellow-400 text-black text-xs font-semibold mr-2 px-2.5 py-0.5 rounded cursor-pointer';
            tagElement.textContent = tag;
            
            // Ajoute un élément pour supprimer le tag
            const removeButton = document.createElement('span');
            removeButton.textContent = ' ×';
            removeButton.className = 'ml-1 text-black font-bold cursor-pointer';
            
            // Écouteur pour supprimer le tag au clic
            removeButton.addEventListener('click', function() {
                removeTag(category, tag);
            });

            // Ajoute le bouton de suppression au tag
            tagElement.appendChild(removeButton);
            selectedTagsContainer.appendChild(tagElement);
        });
    }
}



// Fonction pour supprimer un tag sélectionné
function removeTag(category, tag) {
    const index = selectedTags[category].indexOf(tag);
    if (index !== -1) {
        selectedTags[category].splice(index, 1);
        updateDisplay();
    }
}

// Fonction pour afficher les recettes
function displayRecipes(recipes) {
    recipeContainer.innerHTML = '';
    recipeCountElement.textContent = recipes.length + ' recette' + (recipes.length > 1 ? 's' : '');

    if (recipes.length === 0) {
        recipeContainer.innerHTML = '<p class="text-center text-gray-600">Aucune recette ne contient "' + searchBar.value + '". Essayez un autre mot-clé comme "poulet" ou "chocolat".</p>';
        return;
    }

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const imageUrl = `img/Recette${recipe.id.toString().padStart(2, '0')}.jpg`;
        let ingredientsList = '';
        
        for (let j = 0; j < recipe.ingredients.length; j++) {
            ingredientsList += '<li>' + recipe.ingredients[j].ingredient + '</li>';
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

// Fonction de recherche par texte
function filterRecipesByText(recipes, query) {
    const normalizedQuery = normalizeText(query);
    const filteredRecipes = [];
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const nameMatch = normalizeText(recipe.name).indexOf(normalizedQuery) !== -1;
        let ingredientMatch = false;
        for (let j = 0; j < recipe.ingredients.length; j++) {
            if (normalizeText(recipe.ingredients[j].ingredient).indexOf(normalizedQuery) !== -1) {
                ingredientMatch = true;
                break;
            }
        }
        const descriptionMatch = normalizeText(recipe.description).indexOf(normalizedQuery) !== -1;

        if (nameMatch || ingredientMatch || descriptionMatch) {
            filteredRecipes.push(recipe);
        }
    }
    return filteredRecipes;
}

// Fonction de filtrage par tags
function filterRecipesByTags(recipes, selectedIngredients, selectedAppliances, selectedUstensils) {
    const filteredRecipes = [];
    
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];

        // Vérification des ingrédients
        let hasAllIngredients = true;
        for (let j = 0; j < selectedIngredients.length; j++) {
            const tag = normalizeText(selectedIngredients[j]);
            let found = false;
            for (let k = 0; k < recipe.ingredients.length; k++) {
                if (normalizeText(recipe.ingredients[k].ingredient) === tag) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                hasAllIngredients = false;
                break;
            }
        }

        // Vérification de l'appareil
        let hasSelectedAppliance = selectedAppliances.length === 0;
        for (let j = 0; j < selectedAppliances.length; j++) {
            if (normalizeText(recipe.appliance) === normalizeText(selectedAppliances[j])) {
                hasSelectedAppliance = true;
                break;
            }
        }

        // Vérification des ustensiles
        let hasAllUstensils = true;
        for (let j = 0; j < selectedUstensils.length; j++) {
            const tag = normalizeText(selectedUstensils[j]);
            let found = false;
            for (let k = 0; k < recipe.ustensils.length; k++) {
                if (normalizeText(recipe.ustensils[k]) === tag) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                hasAllUstensils = false;
                break;
            }
        }

        // Ajouter la recette si elle répond aux critères
        if (hasAllIngredients && hasSelectedAppliance && hasAllUstensils) {
            filteredRecipes.push(recipe);
        }
    }
    return filteredRecipes;
}

function addTag(tagType, tagValue) {
    const tag = document.createElement('div');
    tag.classList.add('tag', 'bg-blue-100', 'text-blue-800', 'text-xs', 'font-semibold', 'mr-2', 'px-2.5', 'py-0.5', 'rounded');
    tag.innerHTML = `${tagValue} <span class="remove-tag cursor-pointer">&times;</span>`;
    tag.querySelector('.remove-tag').addEventListener('click', () => {
        tag.remove();
        clearFilter(tagType, tagValue);
    });
    selectedTagsContainer.appendChild(tag);
}


// Extraction des filtres
function extractFilters(recipes) {
    const ingredients = {};
    const appliances = {};
    const ustensils = {};

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        
        for (let j = 0; j < recipe.ingredients.length; j++) {
            ingredients[normalizeText(recipe.ingredients[j].ingredient)] = true;
        }
        appliances[normalizeText(recipe.appliance)] = true;

        for (let j = 0; j < recipe.ustensils.length; j++) {
            ustensils[normalizeText(recipe.ustensils[j])] = true;
        }
    }
    return { 
        ingredients: Object.keys(ingredients), 
        appliances: Object.keys(appliances), 
        ustensils: Object.keys(ustensils) 
    };
}

// Remplir les filtres dynamiquement
function populateFilters(filters) {
    ingredientFilter.innerHTML = '<option value="">Ingrédients</option>';
    appareilFilter.innerHTML = '<option value="">Appareils</option>';
    ustensileFilter.innerHTML = '<option value="">Ustensiles</option>';

    for (let i = 0; i < filters.ingredients.length; i++) {
        ingredientFilter.innerHTML += `<option value="${filters.ingredients[i]}">${filters.ingredients[i]}</option>`;
    }
    for (let i = 0; i < filters.appliances.length; i++) {
        appareilFilter.innerHTML += `<option value="${filters.appliances[i]}">${filters.appliances[i]}</option>`;
    }
    for (let i = 0; i < filters.ustensils.length; i++) {
        ustensileFilter.innerHTML += `<option value="${filters.ustensils[i]}">${filters.ustensils[i]}</option>`;
    }
}

// Normalisation du texte
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
