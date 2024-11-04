document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let recipesData = [];
    const selectedIngredients = [];
    const selectedAppliances = [];
    const selectedUstensils = [];
    const searchBar = document.querySelector('input[type="text"]');
    const selectedTagsContainer = document.getElementById('selected-tags');
    const recipeContainer = document.getElementById('recipe-cards-container');

    // Initialisation des dropdowns personnalisés
    initializeCustomDropdowns();

    // Chargement des données
    fetch('recipes.json')
        .then(response => response.json())
        .then(data => {
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
            if (!select) return;

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

        // Afficher/masquer le dropdown au clic sur le bouton
        button.addEventListener('click', (e) => {
            e.stopPropagation();  // Empêche la propagation pour éviter que l'événement ne cache le dropdown
            toggleDropdown(content, arrow);
        });

        // Afficher le dropdown quand le champ de recherche reçoit le focus
        searchInput.addEventListener('focus', () => {
            content.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
        });

        // Cacher le dropdown quand le champ de recherche perd le focus (avec délai pour permettre les clics à l'intérieur)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                content.classList.add('hidden');
                arrow.style.transform = '';
            }, 200);
        });

        // Filtrage des options en tapant dans le champ de recherche
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            clearButton.classList.toggle('hidden', !searchTerm);
            
            Array.from(optionsContainer.children).forEach(option => {
                const text = option.textContent.toLowerCase();
                option.classList.toggle('hidden', !text.includes(searchTerm));
            });
        });

        // Empêche le dropdown de se fermer si on clique à l'intérieur
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Cacher le dropdown si on clique en dehors
        document.addEventListener('click', () => {
            content.classList.add('hidden');
            arrow.style.transform = '';
        });

        // Effacer le champ de recherche et réinitialiser les options
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

    // Fonction pour afficher/masquer le dropdown
    function toggleDropdown(content, arrow) {
        document.querySelectorAll('.dropdown-content').forEach(el => {
            if (el !== content) {
                el.classList.add('hidden');
                const otherArrow = el.parentElement?.querySelector('span:last-child');
                if (otherArrow) otherArrow.style.transform = '';
            }
        });
        content.classList.toggle('hidden');
        arrow.style.transform = content.classList.contains('hidden') ? '' : 'rotate(180deg)';
    }

    // Fonction pour extraire les filtres des recettes
    function extractFilters(recipes) {
        const ingredients = new Set();
        const appliances = new Set();
        const ustensils = new Set();

        recipes.forEach(recipe => {
            recipe.ingredients.forEach(ing => ingredients.add(ing.ingredient.toLowerCase()));
            if (recipe.appliance) appliances.add(recipe.appliance.toLowerCase());
            recipe.ustensils.forEach(ust => ustensils.add(ust.toLowerCase()));
        });

        return {
            ingredients: Array.from(ingredients).sort(),
            appliances: Array.from(appliances).sort(),
            ustensils: Array.from(ustensils).sort()
        };
    }

    // Fonction pour remplir les options de filtres
    function populateFilters(filters) {
        const containers = {
            ingredients: document.querySelector('#ingredient-filter-container .options-container'),
            appliances: document.querySelector('#appareil-filter-container .options-container'),
            ustensils: document.querySelector('#ustensile-filter-container .options-container')
        };

        if (filters.ingredients) {
            filters.ingredients.forEach(ingredient => {
                const option = createFilterOption(ingredient, 'ingredient', selectedIngredients);
                if (option) containers.ingredients.appendChild(option);
            });
        }

        if (filters.appliances) {
            filters.appliances.forEach(appliance => {
                const option = createFilterOption(appliance, 'appliance', selectedAppliances);
                if (option) containers.appliances.appendChild(option);
            });
        }

        if (filters.ustensils) {
            filters.ustensils.forEach(ustensil => {
                const option = createFilterOption(ustensil, 'ustensil', selectedUstensils);
                if (option) containers.ustensils.appendChild(option);
            });
        }
    }

    // Fonction pour créer une option de filtre
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

    // Fonction pour ajouter un tag sélectionné
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

    // Fonction pour effacer un filtre
    function clearFilter(tagType, tagValue) {
        let array;
        switch(tagType) {
            case 'ingredient': array = selectedIngredients; break;
            case 'appliance': array = selectedAppliances; break;
            case 'ustensil': array = selectedUstensils; break;
            default: return;
        }

        const index = array.indexOf(tagValue);
        if (index > -1) {
            array.splice(index, 1);
        }
        updateSearchResults();
    }

    // Fonction pour mettre à jour les résultats de la recherche
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

    // Fonction pour filtrer les recettes par tags
    function filterRecipesByTags(recipes) {
        return recipes.filter(recipe => {
            const hasAllIngredients = selectedIngredients.every(tag =>
                recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(tag.toLowerCase()))
            );
            
            const hasSelectedAppliance = selectedAppliances.length === 0 || 
                selectedAppliances.includes(recipe.appliance.toLowerCase());
            
            const hasAllUstensils = selectedUstensils.every(tag =>
                recipe.ustensils.some(ust => ust.toLowerCase().includes(tag.toLowerCase()))
            );
            
            return hasAllIngredients && hasSelectedAppliance && hasAllUstensils;
        });
    }

    // Fonction pour filtrer les recettes par texte
    function filterRecipesByText(recipes, query) {
        const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        return recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(normalizedQuery) ||
            recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(normalizedQuery)) ||
            recipe.description.toLowerCase().includes(normalizedQuery)
        );
    }

    // Fonction pour mettre à jour les filtres disponibles
    function updateAvailableFilters(recipes) {
        const filters = extractFilters(recipes);

        filters.ingredients = filters.ingredients.filter(ing => !selectedIngredients.includes(ing));
        filters.appliances = filters.appliances.filter(app => !selectedAppliances.includes(app));
        filters.ustensils = filters.ustensils.filter(ust => !selectedUstensils.includes(ust));

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