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

        recipes.forEach(recipe => {
            const imageUrl = `img/Recette${recipe.id.toString().padStart(2, '0')}.jpg`;
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-full max-w-sm';
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
                        ${recipe.ingredients.map(ing => `
                            <li>
                                <span class="font-medium">${ing.ingredient}</span>
                                ${ing.quantity ? `<span class="text-gray-600">${ing.quantity} ${ing.unit || ''}</span>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            recipeContainer.appendChild(recipeCard);
        });
    }

    // Fonction d'initialisation des dropdowns
    function initializeCustomDropdowns() {
        const filters = [
            { id: 'ingredient-filter', label: 'Ingrédients' },
            { id: 'appareil-filter', label: 'Appareils' },
            { id: 'ustensile-filter', label: 'Ustensiles' }
        ];

        filters.forEach(filter => {
            const select = document.getElementById(filter.id);
            if (!select) {
                console.error(`L'élément ${filter.id} n'a pas été trouvé`);
                return;
            }

            const parent = select.parentElement;
            if (!parent) return;

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
                            <input type="text" 
                                placeholder="Rechercher un ${filter.label.toLowerCase()}"
                                class="w-full p-2 pr-8 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            <button class="clear-search hidden absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>
                    </div>
                    <div class="options-container max-h-60 overflow-y-auto py-2"></div>
                </div>
            `;

            parent.replaceChild(dropdown, select);
            setupDropdownEvents(dropdown);
        });
    }

    // Configuration des événements des dropdowns
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
            document.querySelectorAll('.dropdown-content').forEach(el => {
                if (el !== content) {
                    el.classList.add('hidden');
                    const otherArrow = el.parentElement?.querySelector('span:last-child');
                    if (otherArrow) otherArrow.style.transform = '';
                }
            });
            content.classList.toggle('hidden');
            arrow.style.transform = content.classList.contains('hidden') ? '' : 'rotate(180deg)';
        });

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            clearButton.classList.toggle('hidden', !searchTerm);
            
            Array.from(optionsContainer.children).forEach(option => {
                const text = option.textContent.toLowerCase();
                option.classList.toggle('hidden', !text.includes(searchTerm));
            });
        });

        clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            clearButton.classList.add('hidden');
            Array.from(optionsContainer.children).forEach(option => {
                option.classList.remove('hidden');
            });
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
            if (!selectedArray.includes(value)) {
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

        // Vérifier que tous les conteneurs existent
        if (!containers.ingredients || !containers.appareils || !containers.ustensiles) {
            console.error('Un ou plusieurs conteneurs de filtres non trouvés');
            return;
        }

        // Vider les conteneurs
        Object.values(containers).forEach(container => {
            container.innerHTML = '';
        });

        // Ajouter les options
        if (filters.ingredients) {
            filters.ingredients.forEach(ing => {
                const option = createFilterOption(ing, 'ingredient', selectedIngredients);
                if (option) containers.ingredients.appendChild(option);
            });
        }

        if (filters.appareils) {
            filters.appareils.forEach(app => {
                const option = createFilterOption(app, 'appareil', selectedAppliances);
                if (option) containers.appareils.appendChild(option);
            });
        }

        if (filters.ustensiles) {
            filters.ustensiles.forEach(ust => {
                const option = createFilterOption(ust, 'ustensile', selectedUstensils);
                if (option) containers.ustensiles.appendChild(option);
            });
        }
    }

    function addTag(tagType, tagValue) {
        if (!selectedTagsContainer || !tagValue) return;

        const tag = document.createElement('div');
        tag.className = 'tag bg-yellow-400 p-2 text-black rounded flex items-center gap-1 font-semibold';
        tag.innerHTML = `${tagValue} <span class="remove-tag cursor-pointer">&times;</span>`;
        
        tag.querySelector('.remove-tag')?.addEventListener('click', () => {
            tag.remove();
            clearFilter(tagType, tagValue);
        });
        
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

        const index = array.indexOf(tagValue);
        if (index > -1) {
            array.splice(index, 1);
        }
        updateSearchResults();
    }

    function filterRecipesByTags(recipes) {
        if (!recipes) return [];

        return recipes.filter(recipe => {
            const hasAllIngredients = selectedIngredients.every(tag =>
                recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizeText(tag)))
            );
            
            const hasSelectedAppliance = selectedAppliances.length === 0 || 
                selectedAppliances.includes(normalizeText(recipe.appliance));
            
            const hasAllUstensils = selectedUstensils.every(tag =>
                recipe.ustensils.some(ust => normalizeText(ust).includes(normalizeText(tag)))
            );
            
            return hasAllIngredients && hasSelectedAppliance && hasAllUstensils;
        });
    }

    function filterRecipesByText(recipes, query) {
        if (!recipes || !query) return recipes;

        const normalizedQuery = normalizeText(query);
        return recipes.filter(recipe => {
            return normalizeText(recipe.name).includes(normalizedQuery) ||
                recipe.ingredients.some(ing => normalizeText(ing.ingredient).includes(normalizedQuery)) ||
                normalizeText(recipe.description).includes(normalizedQuery);
        });
    }

    function normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    }

    function extractFilters(recipes) {
        if (!recipes || !Array.isArray(recipes)) return { ingredients: [], appareils: [], ustensiles: [] };

        const ingredients = new Set();
        const appareils = new Set();
        const ustensiles = new Set();
        
        recipes.forEach(recipe => {
            recipe.ingredients?.forEach(ing => ingredients.add(ing.ingredient.toLowerCase()));
            if (recipe.appliance) appareils.add(recipe.appliance.toLowerCase());
            recipe.ustensils?.forEach(ust => ustensiles.add(ust.toLowerCase()));
        });
        
        return {
            ingredients: [...ingredients].sort(),
            appareils: [...appareils].sort(),
            ustensiles: [...ustensiles].sort()
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
        
        filters.ingredients = filters.ingredients.filter(ing => !selectedIngredients.includes(ing));
        filters.appareils = filters.appareils.filter(app => !selectedAppliances.includes(app));
        filters.ustensiles = filters.ustensiles.filter(ust => !selectedUstensils.includes(ust));
        
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
        document.querySelectorAll('.dropdown-content').forEach(content => {
            content.classList.add('hidden');
            const arrow = content.parentElement?.querySelector('.dropdown-button span:last-child');
            if (arrow) arrow.style.transform = '';
        });
    });
});