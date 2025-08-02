document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const surahGrid = document.querySelector('.surah-grid');
    let allSurahs = [];

    // Function to fetch all surahs from the API
    async function fetchAllSurahs() {
        try {
            const response = await fetch('http://api.alquran.cloud/v1/surah');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allSurahs = data.data; // Store the surah list
            console.log('Successfully fetched and stored', allSurahs.length, 'surahs.');
        } catch (error) {
            console.error('Error fetching surah list:', error);
        }
    }

    // Function to render the surah grid based on a filtered list
    function renderSurahGrid(surahsToDisplay) {
        if (!surahGrid) return;
        
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
            console.log('Search attempted, but surah data is not yet loaded.');
            return;
        }

        const query = searchInput.value.toLowerCase();
        
        const filteredSurahs = allSurahs.filter(surah => {
            const englishMatch = surah.englishName.toLowerCase().includes(query);
            const arabicMatch = surah.name.toLowerCase().includes(query);
            
            return englishMatch || arabicMatch;
        });

        console.log('Search Query:', query);
        console.log('Filtered Surahs:', filteredSurahs);

        renderSurahGrid(filteredSurahs);
    }

    // Initialize the application
    async function initialize() {
        // Only set up search functionality on pages with the surah grid
        if (surahGrid && searchInput) {
            await fetchAllSurahs(); // Fetch all surahs initially
            
            // Render the full grid after the data is fetched.
            // This is crucial for the search to work correctly.
            renderSurahGrid(allSurahs);

            // Add a 'keyup' event listener to the search input for real-time filtering
            searchInput.addEventListener('keyup', handleSearch);
            console.log('Search functionality initialized. Keyup listener attached.');
        } else {
            console.log('Search elements not found on this page.');
        }
    }

    initialize();
});
