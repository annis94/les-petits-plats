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
        console.error('Erreur lors du chargement des recettes :', error); // Gestion des erreurs si la requête échoue
    });

// Récupération de l'élément HTML où les cartes de recettes seront affichées
const recipeContainer = document.getElementById('recipe-cards-container');

// Fonction pour afficher les recettes sur la page
function displayRecipes(recipes) {
    recipeContainer.innerHTML = ''; 
    const recipeCountElement = document.getElementById('recipe-count');
    
    recipeCountElement.textContent = `${recipes.length} recette${recipes.length > 1 ? 's' : ''}`;

    if (recipes.length === 0) {
        recipeContainer.innerHTML = `<p class="text-center text-gray-600">Aucune recette ne contient "${searchBar.value}".</p>`;
        return;
    }

    let recipesHTML = '';
    recipes.forEach(recipe => {
        const imageUrl = `img/Recette${recipe.id.toString().padStart(2, '0')}.jpg`;
        recipesHTML += `
            <div class="recipe-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-full max-w-sm" data-id="${recipe.id}">
                <div class="relative">
                    <img src="${imageUrl}" alt="${recipe.name}" class="w-full h-60 object-cover rounded-t-lg" />
                    <span class="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">${recipe.time} min</span>
                </div>
                <div class="p-5 flex flex-col flex-1">
                    <h3 class="text-lg font-bold mb-2">${recipe.name}</h3>
                    <p class="text-sm text-gray-600 mb-4"><strong>RECETTE</strong><br>${recipe.description}</p>
                    <p class="text-sm font-semibold mb-2"><strong>INGRÉDIENTS</strong></p>
                    <ul class="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                        ${recipe.ingredients.map(ing => `<li>${ing.ingredient}</li>`).join('')}
                    </ul>
                </div>
            </div>`;
    });
    recipeContainer.innerHTML = recipesHTML;
    
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', () => {
            const recipeId = card.getAttribute('data-id');
            // Action pour afficher les détails de la recette
        });
    });
}


// Fonction de recherche avancée combinant plusieurs filtres
function filterRecipesByTags(recipes, selectedIngredients, selectedAppliances, selectedUstensils) {
    return recipes.filter(recipe => {
        const hasAllIngredients = selectedIngredients.every(tag =>
            recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizeText(tag)))
        );
        const hasSelectedAppliance = selectedAppliances.length === 0 || selectedAppliances.includes(normalizeText(recipe.appliance));
        const hasAllUstensils = selectedUstensils.every(tag =>
            recipe.ustensils.some(ust => normalizeText(ust).includes(normalizeText(tag)))
        );
        return hasAllIngredients && hasSelectedAppliance && hasAllUstensils;
    });
}

// Normalisation du texte pour gérer les variations d'orthographe et d'accentuation
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "");
}

// Variables pour stocker les tags sélectionnés
const selectedIngredients = [];
const selectedAppliances = [];
const selectedUstensils = [];

// Récupération des éléments HTML pour les filtres et la barre de recherche
const searchBar = document.querySelector('input[type="text"]'); // Sélectionne la barre de recherche
const ingredientFilter = document.getElementById('ingredient-filter');
const appareilFilter = document.getElementById('appareil-filter');
const ustensileFilter = document.getElementById('ustensile-filter');
const selectedTagsContainer = document.getElementById('selected-tags');

// Fonction pour filtrer les recettes en fonction de la recherche textuelle
function filterRecipesByText(recipes, query) {
    const normalizedQuery = normalizeText(query); // Utilise la fonction de normalisation pour rendre la recherche insensible aux accents et majuscules
    return recipes.filter(recipe => {
        // Vérifie si le titre, les ingrédients ou la description contiennent la requête de recherche
        return (
            normalizeText(recipe.name).includes(normalizedQuery) ||
            recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizedQuery)) ||
            normalizeText(recipe.description).includes(normalizedQuery)
        );
    });
}

// Ajoute un écouteur d'événements pour surveiller les saisies dans la barre de recherche
// Variable pour gérer le délai de debounce
let debounceTimeout;

// Ajoute un écouteur d'événements pour surveiller les saisies dans la barre de recherche avec un délai
searchBar.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const query = searchBar.value;
        if (query.length >= 3) {
            const searchResults = filterRecipesByText(recipesData, query);
            displayRecipes(searchResults);
            updateAvailableFilters(searchResults);
        } else {
            // Affiche toutes les recettes si la recherche est vide ou contient moins de 3 caractères
            displayRecipes(recipesData);
            updateAvailableFilters(recipesData);
        }
    }, 300);
});

// Écouteurs d'événements pour les filtres et la recherche avancée
ingredientFilter.addEventListener('change', () => {
    const selectedIngredient = ingredientFilter.value;
    if (selectedIngredient && !selectedIngredients.includes(selectedIngredient)) {
        selectedIngredients.push(selectedIngredient);
        addTag('ingredient', selectedIngredient);
        ingredientFilter.value = ""; // Réinitialiser la sélection
        updateSearchResults();
    }
});

appareilFilter.addEventListener('change', () => {
    const selectedAppareil = appareilFilter.value;
    if (selectedAppareil && !selectedAppliances.includes(selectedAppareil)) {
        selectedAppliances.push(selectedAppareil);
        addTag('appareil', selectedAppareil);
        appareilFilter.value = ""; // Réinitialiser la sélection
        updateSearchResults();
    }
});

ustensileFilter.addEventListener('change', () => {
    const selectedUstensile = ustensileFilter.value;
    if (selectedUstensile && !selectedUstensils.includes(selectedUstensile)) {
        selectedUstensils.push(selectedUstensile);
        addTag('ustensile', selectedUstensile);
        ustensileFilter.value = ""; // Réinitialiser la sélection
        updateSearchResults();
    }
});


// Fonction pour ajouter un tag visuel lorsqu'un filtre est sélectionné
function addTag(tagType, tagValue) {
    const tag = document.createElement('div');
    tag.classList.add('tag', 'bg-yellow-400', 'p-2', 'text-black', 'rounded', 'flex', 'items-center', 'gap-1', 'font-semibold');
    tag.innerHTML = `${tagValue} <span class="remove-tag cursor-pointer">&times;</span>`;
    tag.querySelector('.remove-tag').addEventListener('click', () => {
        tag.remove();
        clearFilter(tagType, tagValue);
    });
    selectedTagsContainer.appendChild(tag);
}

// Fonction pour retirer le filtre appliqué
function clearFilter(tagType, tagValue) {
    if (tagType === 'ingredient') {
        selectedIngredients.splice(selectedIngredients.indexOf(tagValue), 1);
    } else if (tagType === 'appareil') {
        selectedAppliances.splice(selectedAppliances.indexOf(tagValue), 1);
    } else if (tagType === 'ustensile') {
        selectedUstensils.splice(selectedUstensils.indexOf(tagValue), 1);
    }
    updateSearchResults();
}

// Fonction pour mettre à jour les résultats de recherche en fonction des tags sélectionnés
function updateSearchResults() {
    let filteredRecipes = recipesData;
    
    // Application des tags en premier pour réduire le jeu de résultats
    if (selectedIngredients.length > 0 || selectedAppliances.length > 0 || selectedUstensils.length > 0) {
        filteredRecipes = filterRecipesByTags(filteredRecipes, selectedIngredients, selectedAppliances, selectedUstensils);
    }
    
    // Application de la recherche textuelle si elle est valide
    if (searchBar.value.length >= 3) {
        filteredRecipes = filterRecipesByText(filteredRecipes, searchBar.value);
    }
    
    displayRecipes(filteredRecipes);
    updateAvailableFilters(filteredRecipes);
}


// Fonction pour extraire les filtres des recettes
function extractFilters(recipes) {
    let ingredients = new Set();
    let appareils = new Set();
    let ustensiles = new Set();
    recipes.forEach(recipe => {
        recipe.ingredients.forEach(ing => ingredients.add(ing.ingredient.toLowerCase()));
        appareils.add(recipe.appliance.toLowerCase());
        recipe.ustensils.forEach(ust => ustensiles.add(ust.toLowerCase()));
    });
    return { ingredients, appareils, ustensiles };
}

// Fonction pour remplir les filtres dynamiquement
function populateFilters(filters) {
    filters.ingredients.forEach(ing => {
        ingredientFilter.innerHTML += `<option value="${ing}">${ing}</option>`;
    });
    filters.appareils.forEach(app => {
        appareilFilter.innerHTML += `<option value="${app}">${app}</option>`;
    });
    filters.ustensiles.forEach(ust => {
        ustensileFilter.innerHTML += `<option value="${ust}">${ust}</option>`;
    });
}

// Mise à jour dynamique des options de filtres
function updateAvailableFilters(recipes) {
    const filters = extractFilters(recipes);

    // Exclure les tags sélectionnés des options de filtre
    filters.ingredients = [...filters.ingredients].filter(ing => !selectedIngredients.includes(ing));
    filters.appareils = [...filters.appareils].filter(app => !selectedAppliances.includes(app));
    filters.ustensiles = [...filters.ustensiles].filter(ust => !selectedUstensils.includes(ust));

    ingredientFilter.innerHTML = '<option value="">Ingrédients</option>'; 
    appareilFilter.innerHTML = '<option value="">Appareils</option>';
    ustensileFilter.innerHTML = '<option value="">Ustensiles</option>';
    populateFilters(filters);
}



















