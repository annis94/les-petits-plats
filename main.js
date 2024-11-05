// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let recipesData = [];
    const selectedIngredients = [];
    const selectedAppliances = [];
    const selectedUstensils = [];
    const searchBar = document.querySelector('input[type="text"]');
    const selectedTagsContainer = document.getElementById('selected-tags');
    const recipeContainer = document.getElementById('recipe-cards-container');

    // Initialisons d'abord les dropdowns
    initializeCustomDropdowns();

    // Puis chargeons les données
    fetch('recipes.json')
        .then(response => response.json())
        .then(data => {
            console.log("Données reçues :", data);
            recipesData = data;
            const filters = extractFilters(recipesData);
            displayRecipes(recipesData);
            populateFilters(filters);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des recettes :', error);
        });

    // Fonction pour afficher les recettes
    function displayRecipes(recipes) {
        if (!recipeContainer) return;
        
        recipeContainer.innerHTML = '';
        const recipeCountElement = document.getElementById('recipe-count');
        if (recipeCountElement) {
            recipeCountElement.textContent = `${recipes.length} recette${recipes.length > 1 ? 's' : ''}`;
        }

        if (recipes.length === 0) {
            recipeContainer.innerHTML = '<p class="text-center text-gray-600">Aucune recette ne correspond à votre recherche.</p>';
            return;
        }

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const imageUrl = `img/Recette${recipe.id.toString().padStart(2, '0')}.jpg`;
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-full max-w-sm';
            
            // Construction de la liste des ingrédients
            let ingredientsHTML = '';
            for (let j = 0; j < recipe.ingredients.length; j++) {
                const ing = recipe.ingredients[j];
                ingredientsHTML += `
                    <li>
                        <span class="font-medium">${ing.ingredient}</span>
                        ${ing.quantity ? `<span class="text-gray-600">${ing.quantity} ${ing.unit || ''}</span>` : ''}
                    </li>
                `;
            }

            recipeCard.innerHTML = `
                <div class="relative">
                    <img src="${imageUrl}" alt="${recipe.name}" class="w-full h-60 object-cover rounded-t-lg" />
                    <span class="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                        ${recipe.time} min
                    </span>
                </div>
                <div class="p-5 flex flex-col flex-1">
                    <h3 class="text-lg font-bold mb-2">${recipe.name}</h3>
                    <p class="text-sm text-gray-600 mb-4"><strong>RECETTE</strong><br>${recipe.description}</p>
                    <p class="text-sm font-semibold mb-2"><strong>INGRÉDIENTS</strong></p>
                    <ul class="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                        ${ingredientsHTML}
                    </ul>
                </div>
            `;
            recipeContainer.appendChild(recipeCard);
        }
    }

    function initializeCustomDropdowns() {
        const filters = [
            { id: 'ingredient-filter', label: 'Ingrédients' },
            { id: 'appareil-filter', label: 'Appareils' },
            { id: 'ustensile-filter', label: 'Ustensiles' }
        ];

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            const select = document.getElementById(filter.id);
            if (!select) {
                console.error(`L'élément ${filter.id} n'a pas été trouvé`);
                continue;
            }

            const parent = select.parentElement;
            if (!parent) continue;

            const dropdown = document.createElement('div');
            dropdown.setAttribute('id', `${filter.id}-container`);
            dropdown.className = 'custom-dropdown relative';
            dropdown.innerHTML = `
                <button class="dropdown-button w-64 bg-white p-4 rounded-lg shadow-md text-left flex justify-between items-center">
                    <span>${filter.label}</span>
                    <span class="transform transition-transform duration-200">&darr;</span>
                </button>
                <div class="dropdown-content hidden absolute mt-2 w-64 bg-white rounded-lg shadow-lg z-50">
                   <div class="p-2 border-b">
                        <div class="relative">
                            <input 
                                type="text" 
                                class="w-full p-2 pr-10 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <button class="clear-search hidden absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>
                    </div>
                    <div class="options-container max-h-60 overflow-y-auto py-2"></div>
                </div>
            `;

            parent.replaceChild(dropdown, select);
            setupDropdownEvents(dropdown);
        }
    }

    function setupDropdownEvents(dropdown) {
        const button = dropdown.querySelector('.dropdown-button');
        const content = dropdown.querySelector('.dropdown-content');
        const searchInput = dropdown.querySelector('input');
        const clearButton = dropdown.querySelector('.clear-search');
        const optionsContainer = dropdown.querySelector('.options-container');
        const arrow = button.querySelector('span:last-child');

        if (!button || !content || !searchInput || !clearButton || !optionsContainer || !arrow) return;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const allDropdowns = document.querySelectorAll('.dropdown-content');
            for (let i = 0; i < allDropdowns.length; i++) {
                if (allDropdowns[i] !== content) {
                    allDropdowns[i].classList.add('hidden');
                    const otherArrow = allDropdowns[i].parentElement?.querySelector('span:last-child');
                    if (otherArrow) otherArrow.style.transform = '';
                }
            }
            content.classList.toggle('hidden');
            arrow.style.transform = content.classList.contains('hidden') ? '' : 'rotate(180deg)';
        });

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            clearButton.classList.toggle('hidden', !searchTerm);
            
            const options = optionsContainer.children;
            for (let i = 0; i < options.length; i++) {
                const text = options[i].textContent.toLowerCase();
                options[i].classList.toggle('hidden', !text.includes(searchTerm));
            }
        });

        clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            clearButton.classList.add('hidden');
            
            const options = optionsContainer.children;
            for (let i = 0; i < options.length; i++) {
                options[i].classList.remove('hidden');
            }
            searchInput.focus();
        });
    }

    function createFilterOption(value, type, selectedArray) {
        if (!value) return null;

        const option = document.createElement('button');
        option.className = 'w-full text-left px-4 py-2 hover:bg-yellow-100 focus:outline-none focus:bg-yellow-100';
        option.textContent = value;
        option.onclick = (e) => {
            e.stopPropagation();
            let isAlreadySelected = false;
            for (let i = 0; i < selectedArray.length; i++) {
                if (selectedArray[i] === value) {
                    isAlreadySelected = true;
                    break;
                }
            }
            if (!isAlreadySelected) {
                selectedArray.push(value);
                addTag(type, value);
                updateSearchResults();
            }
        };
        return option;
    }

    function populateFilters(filters) {
        if (!filters) return;

        const containers = {
            ingredients: document.querySelector('#ingredient-filter-container .options-container'),
            appareils: document.querySelector('#appareil-filter-container .options-container'),
            ustensiles: document.querySelector('#ustensile-filter-container .options-container')
        };

        if (!containers.ingredients || !containers.appareils || !containers.ustensiles) {
            console.error('Un ou plusieurs conteneurs de filtres non trouvés');
            return;
        }

        // Vider les conteneurs
        for (const key in containers) {
            containers[key].innerHTML = '';
        }

        // Ajouter les options
        if (filters.ingredients) {
            for (let i = 0; i < filters.ingredients.length; i++) {
                const option = createFilterOption(filters.ingredients[i], 'ingredient', selectedIngredients);
                if (option) containers.ingredients.appendChild(option);
            }
        }

        if (filters.appareils) {
            for (let i = 0; i < filters.appareils.length; i++) {
                const option = createFilterOption(filters.appareils[i], 'appareil', selectedAppliances);
                if (option) containers.appareils.appendChild(option);
            }
        }

        if (filters.ustensiles) {
            for (let i = 0; i < filters.ustensiles.length; i++) {
                const option = createFilterOption(filters.ustensiles[i], 'ustensile', selectedUstensils);
                if (option) containers.ustensiles.appendChild(option);
            }
        }
    }

    function addTag(tagType, tagValue) {
        if (!selectedTagsContainer || !tagValue) return;

        const tag = document.createElement('div');
        tag.className = 'tag bg-yellow-400 p-2 text-black rounded flex items-center gap-1 font-semibold';
        tag.innerHTML = `${tagValue} <span class="remove-tag cursor-pointer">&times;</span>`;
        
        const removeButton = tag.querySelector('.remove-tag');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                tag.remove();
                clearFilter(tagType, tagValue);
            });
        }
        
        selectedTagsContainer.appendChild(tag);
    }

    function clearFilter(tagType, tagValue) {
        if (!tagType || !tagValue) return;

        let array;
        switch(tagType) {
            case 'ingredient': array = selectedIngredients; break;
            case 'appareil': array = selectedAppliances; break;
            case 'ustensile': array = selectedUstensils; break;
            default: return;
        }

        for (let i = 0; i < array.length; i++) {
            if (array[i] === tagValue) {
                array.splice(i, 1);
                break;
            }
        }
        updateSearchResults();
    }

    function filterRecipesByTags(recipes) {
        if (!recipes) return [];

        let filteredRecipes = [];
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            let hasAllIngredients = true;
            let hasSelectedAppliance = true;
            let hasAllUstensils = true;

            // Vérifier les ingrédients
            for (let j = 0; j < selectedIngredients.length; j++) {
                const tag = selectedIngredients[j];
                let ingredientFound = false;
                for (let k = 0; k < recipe.ingredients.length; k++) {
                    if (normalizeText(recipe.ingredients[k].ingredient).includes(normalizeText(tag))) {
                        ingredientFound = true;
                        break;
                    }
                }
                if (!ingredientFound) {
                    hasAllIngredients = false;
                    break;
                }
            }

            // Vérifier l'appareil
            if (selectedAppliances.length > 0) {
                hasSelectedAppliance = false;
                for (let j = 0; j < selectedAppliances.length; j++) {
                    if (normalizeText(recipe.appliance) === normalizeText(selectedAppliances[j])) {
                        hasSelectedAppliance = true;
                        break;
                    }
                }
            }

            // Vérifier les ustensiles
            for (let j = 0; j < selectedUstensils.length; j++) {
                const tag = selectedUstensils[j];
                let ustensilFound = false;
                for (let k = 0; k < recipe.ustensils.length; k++) {
                    if (normalizeText(recipe.ustensils[k]).includes(normalizeText(tag))) {
                        ustensilFound = true;
                        break;
                    }
                }
                if (!ustensilFound) {
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

    function filterRecipesByText(recipes, query) {
        if (!recipes || !query) return recipes;

        const normalizedQuery = normalizeText(query);
        let filteredRecipes = [];
        
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (normalizeText(recipe.name).includes(normalizedQuery)) {
                filteredRecipes.push(recipe);
                continue;
            }

            let foundInIngredients = false;
            for (let j = 0; j < recipe.ingredients.length; j++) {
                if (normalizeText(recipe.ingredients[j].ingredient).includes(normalizedQuery)) {
                    foundInIngredients = true;
                    break;
                }
            }
            
            if (foundInIngredients || normalizeText(recipe.description).includes(normalizedQuery)) {
                filteredRecipes.push(recipe);
            }
        }

        return filteredRecipes;
    }

    function normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    }

    function extractFilters(recipes) {
        if (!recipes || !Array.isArray(recipes)) {
            return { ingredients: [], appareils: [], ustensiles: [] };
        }

        const ingredients = [];
        const appareils = [];
        const ustensiles = [];
        
        // Parcourir toutes les recettes
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            
            // Extraire les ingrédients
            if (recipe.ingredients) {
                for (let j = 0; j < recipe.ingredients.length; j++) {
                    const ingredient = recipe.ingredients[j].ingredient.toLowerCase();
                    let exists = false;
                    for (let k = 0; k < ingredients.length; k++) {
                        if (ingredients[k] === ingredient) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        ingredients.push(ingredient);
                    }
                }
            }

            // Extraire les appareils
            if (recipe.appliance) {
                const appliance = recipe.appliance.toLowerCase();
                let exists = false;
                for (let j = 0; j < appareils.length; j++) {
                    if (appareils[j] === appliance) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    appareils.push(appliance);
                }
            }

            // Extraire les ustensiles
            if (recipe.ustensils) {
                for (let j = 0; j < recipe.ustensils.length; j++) {
                    const ustensil = recipe.ustensils[j].toLowerCase();
                    let exists = false;
                    for (let k = 0; k < ustensiles.length; k++) {
                        if (ustensiles[k] === ustensil) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        ustensiles.push(ustensil);
                    }
                }
            }
        }
        
        // Trier les tableaux
        for (let i = 0; i < ingredients.length - 1; i++) {
            for (let j = i + 1; j < ingredients.length; j++) {
                if (ingredients[i] > ingredients[j]) {
                    const temp = ingredients[i];
                    ingredients[i] = ingredients[j];
                    ingredients[j] = temp;
                }
            }
        }

        for (let i = 0; i < appareils.length - 1; i++) {
            for (let j = i + 1; j < appareils.length; j++) {
                if (appareils[i] > appareils[j]) {
                    const temp = appareils[i];
                    appareils[i] = appareils[j];
                    appareils[j] = temp;
                }
            }
        }

        for (let i = 0; i < ustensiles.length - 1; i++) {
            for (let j = i + 1; j < ustensiles.length; j++) {
                if (ustensiles[i] > ustensiles[j]) {
                    const temp = ustensiles[i];
                    ustensiles[i] = ustensiles[j];
                    ustensiles[j] = temp;
                }
            }
        }
        
        return {
            ingredients: ingredients,
            appareils: appareils,
            ustensiles: ustensiles
        };
    }

    function updateSearchResults() {
        let filteredRecipes = recipesData;
        
        if (selectedIngredients.length > 0 || selectedAppliances.length > 0 || selectedUstensils.length > 0) {
            filteredRecipes = filterRecipesByTags(filteredRecipes);
        }
        
        if (searchBar && searchBar.value.length >= 3) {
            filteredRecipes = filterRecipesByText(filteredRecipes, searchBar.value);
        }
        
        displayRecipes(filteredRecipes);
        updateAvailableFilters(filteredRecipes);
    }

    function updateAvailableFilters(recipes) {
        if (!recipes) return;
        const filters = extractFilters(recipes);
        
        // Filtrer les ingrédients déjà sélectionnés
        const filteredIngredients = [];
        for (let i = 0; i < filters.ingredients.length; i++) {
            let isSelected = false;
            for (let j = 0; j < selectedIngredients.length; j++) {
                if (filters.ingredients[i] === selectedIngredients[j]) {
                    isSelected = true;
                    break;
                }
            }
            if (!isSelected) {
                filteredIngredients.push(filters.ingredients[i]);
            }
        }
        filters.ingredients = filteredIngredients;

        // Filtrer les appareils déjà sélectionnés
        const filteredAppareils = [];
        for (let i = 0; i < filters.appareils.length; i++) {
            let isSelected = false;
            for (let j = 0; j < selectedAppliances.length; j++) {
                if (filters.appareils[i] === selectedAppliances[j]) {
                    isSelected = true;
                    break;
                }
            }
            if (!isSelected) {
                filteredAppareils.push(filters.appareils[i]);
            }
        }
        filters.appareils = filteredAppareils;

        // Filtrer les ustensiles déjà sélectionnés
        const filteredUstensiles = [];
        for (let i = 0; i < filters.ustensiles.length; i++) {
            let isSelected = false;
            for (let j = 0; j < selectedUstensils.length; j++) {
                if (filters.ustensiles[i] === selectedUstensils[j]) {
                    isSelected = true;
                    break;
                }
            }
            if (!isSelected) {
                filteredUstensiles.push(filters.ustensiles[i]);
            }
        }
        filters.ustensiles = filteredUstensiles;
        
        populateFilters(filters);
    }

    // Écouteur d'événements pour la barre de recherche principale
    if (searchBar) {
        let debounceTimeout;
        searchBar.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const query = searchBar.value;
                if (query.length >= 3 || query.length === 0) {
                    updateSearchResults();
                }
            }, 300);
        });
    }

    // Fermeture des dropdowns en cliquant ailleurs
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.add('hidden');
            const arrow = dropdowns[i].parentElement?.querySelector('.dropdown-button span:last-child');
            if (arrow) arrow.style.transform = '';
        }
    });
});