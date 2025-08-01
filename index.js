const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// A reusable function to get all surahs
async function getAllSurahs() {
    try {
        const response = await axios.get('http://api.alquran.cloud/v1/surah');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching surah list:', error.message);
        return [];
    }
}

// Route for the homepage to display the surah grid
app.get('/', async (req, res) => {
    try {
        const allSurahs = await getAllSurahs();
        // Generate the HTML for the Surah grid items
        const surahGridHtml = allSurahs.map(surah => `
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

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>القرآن الكريم</title>
            <link rel="stylesheet" href="/styles.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        </head>
        <body class="dark-theme">
            <header class="header">
                <div class="container">
                    <div class="logo">
                        <a href="/">
                            <h1>القرآن</h1>
                        </a>
                    </div>
                    <div class="search-bar">
                        <input type="text" placeholder="Search Surah or Ayah...">
                        <button><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </header>
            <div class="main-content-grid">
                <div class="surah-grid">
                    ${surahGridHtml}
                </div>
            </div>
            <script src="/script.js"></script>
        </body>
        </html>
        `;
        res.send(htmlContent);
    } catch (error) {
        console.error('Error fetching surah list for homepage:', error.message);
        res.status(500).send('Error loading surah list.');
    }
});

// Dynamic route for each surah, which displays the verses
app.get('/surah/:surahNumber', async (req, res) => {
    const surahNumber = req.params.surahNumber;

    try {
        // Fetch data for the specific surah
        const surahResponse = await axios.get(`http://api.alquran.cloud/v1/surah/${surahNumber}`);
        const surahData = surahResponse.data.data;

        // Generate the HTML for all the verses (ayahs)
        const ayahsHtml = surahData.ayahs.map(ayah => `
            <div class="ayah">
                <div class="ayah-text">
                    <span class="ayah-number">${ayah.numberInSurah}</span>
                    <p>${ayah.text}</p>
                </div>
            </div>
        `).join('');

        // Combine it all into a single HTML page
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${surahData.name} - القرآن الكريم</title>
            <link rel="stylesheet" href="/styles.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        </head>
        <body class="dark-theme">

            <header class="header">
                <div class="container">
                    <div class="logo">
                        <a href="/">
                            <h1>القرآن</h1>
                        </a>
                    </div>
                    <div class="search-bar">
                        <input type="text" placeholder="Search Surah or Ayah...">
                        <button><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </header>

            <div class="main-content-single-surah">
                <div class="surah-info">
                    <div class="surah-title-arabic">
                        <h1>${surahData.name}</h1>
                        <p>${surahData.englishName}</p>
                    </div>
                    <div class="surah-details">
                        <span>${surahData.revelationType}</span>
                        <span>${surahData.numberOfAyahs} Ayahs</span>
                    </div>
                </div>
    
                ${surahNumber !== '1' && surahNumber !== '9' ? `<div class="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
                
                <div class="ayah-container">
                    ${ayahsHtml}
                </div>
            </div>
            
            <script src="/script.js"></script>
        </body>
        </html>
        `;

        res.send(htmlContent);

    } catch (error) {
        console.error(`Error fetching data for surah ${surahNumber}:`, error.message);
        res.status(404).send('Surah not found or an error occurred.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});