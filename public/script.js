document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const surahGrid = document.querySelector('.surah-grid');
    let allSurahs = [];

    // Function to fetch all surahs from the API
    async function fetchAllSurahs() {
        try {
            const response = await fetch('http://api.alquran.cloud/v1/surah');
            const data = await response.json();
            allSurahs = data.data; // Store the surah list
        } catch (error) {
            console.error('Error fetching surah list:', error);
        }
    }

    // Function to render the surah grid based on a filtered list
    function renderSurahGrid(surahsToDisplay) {
        if (!surahGrid) return; // Prevent errors if the element doesn't exist
        
        // Generate the HTML for the Surah grid items
        const surahGridHtml = surahsToDisplay.map(surah => `
            <a href="/surah/${surah.number}" class="surah-item">
                <div class="surah-number-container">
                    <span class="surah-number">${surah.number}</span>
                </div>
                <div class="surah-details">
                    <span class="surah-title-arabic">${surah.name}</span>
                    <span class="surah-title-english">${surah.englishName}</span>
                    <span class="ayah-count">${surah.numberOfAyahs} Ayahs</span>
                </div>
            </a>
        `).join('');

        surahGrid.innerHTML = surahGridHtml;
    }

    // Function to handle the search logic
    function handleSearch() {
        if (allSurahs.length === 0) {
            // Data not loaded yet, prevent search from running on an empty list
            return;
        }

        // Get the search query and convert to lowercase for case-insensitive search
        const query = searchInput.value.toLowerCase();
        
        // Filter the surah list based on the search query
        const filteredSurahs = allSurahs.filter(surah => {
            // Check if the query is in the English or Arabic name
            const englishMatch = surah.englishName.toLowerCase().includes(query);
            const arabicMatch = surah.name.toLowerCase().includes(query);
            
            return englishMatch || arabicMatch;
        });

        console.log('Search Query:', query);
        console.log('Filtered Surahs:', filteredSurahs);

        // Render the grid with the filtered results
        renderSurahGrid(filteredSurahs);
    }

    // Initialize the application
    async function initialize() {
        // Only set up search functionality on pages with the surah grid
        if (surahGrid) {
            await fetchAllSurahs(); // Fetch all surahs initially
            
            // Add a 'keyup' event listener to the search input for real-time filtering
            if (searchInput) {
                searchInput.addEventListener('keyup', handleSearch);
            }
        }
    }

    initialize();
});
