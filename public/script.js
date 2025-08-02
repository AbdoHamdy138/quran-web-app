document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const surahGrid = document.querySelector('.surah-grid');
    const ayahContainer = document.querySelector('.ayah-container');
    const translationToggle = document.getElementById('translation-toggle');
    const audioToggle = document.getElementById('audio-toggle');
    const fontToggle = document.getElementById('font-toggle'); // New font toggle button
    const ayahTexts = document.querySelectorAll('.ayah-text');
    let allSurahs = [];
    let translationCache = {};
    let isTranslationVisible = false;
    let currentFont = 'Lateef';

    // --- Search functionality for the homepage ---
    async function fetchAllSurahsAndInitializeSearch() {
        if (!surahGrid || !searchInput) {
            console.log('Surah grid or search input not found. Skipping search initialization.');
            return;
        }

        try {
            const response = await fetch('http://api.alquran.cloud/v1/surah');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allSurahs = data.data; // Store the surah list
            console.log('Successfully fetched and stored', allSurahs.length, 'surahs.');
            
            renderSurahGrid(allSurahs);

            searchInput.addEventListener('keyup', handleSearch);
            console.log('Search functionality initialized. Keyup listener attached.');
        } catch (error) {
            console.error('Error fetching surah list:', error);
            searchInput.addEventListener('keyup', () => {
                renderSurahGrid([]);
            });
        }
    }
    
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

    function handleSearch() {
        if (allSurahs.length === 0) {
            console.log('Search attempted, but surah data is not yet loaded.');
            return;
        }

        const query = searchInput.value.toLowerCase();
        
        const filteredSurahs = allSurahs.filter(surah => {
            const englishMatch = surah.englishName.toLowerCase().includes(query);
            const arabicMatch = surah.name.toLowerCase().includes(query);
            
            return englishMatch || arabicMatch;
        });

        renderSurahGrid(filteredSurahs);
    }
    
    // --- Gemini LLM Ayah Explanation functionality for surah pages ---
    async function fetchAyahExplanation(ayahText, ayahExplanationDiv) {
        ayahExplanationDiv.style.display = 'block';
        ayahExplanationDiv.classList.add('loading');
        ayahExplanationDiv.innerHTML = '';
        const prompt = `Give a concise explanation of the following Quranic verse in Arabic:\n\n${ayahText}\n\n`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
              const text = result.candidates[0].content.parts[0].text;
              ayahExplanationDiv.innerHTML = text;
            } else {
              ayahExplanationDiv.innerHTML = "تعذر الحصول على تفسير. الرجاء المحاولة مرة أخرى.";
            }
        } catch (error) {
            console.error('Gemini API call failed:', error);
            ayahExplanationDiv.innerHTML = "حدث خطأ. الرجاء التحقق من اتصالك بالإنترنت.";
        } finally {
            ayahExplanationDiv.classList.remove('loading');
        }
    }
    
    // --- Translation and Audio functionality for surah pages ---
    async function fetchTranslation(surahNumber) {
        const url = `http://api.alquran.cloud/v1/surah/${surahNumber}/ar.muhammadagourelifet`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            translationCache[surahNumber] = data.data.ayahs;
            return data.data.ayahs;
        } catch (error) {
            console.error('Error fetching translation:', error);
            return null;
        }
    }

    function toggleTranslation() {
        isTranslationVisible = !isTranslationVisible;
        const translationDivs = document.querySelectorAll('.ayah-translation');
        if (isTranslationVisible) {
            translationToggle.querySelector('span').textContent = 'إخفاء الترجمة';
            translationToggle.querySelector('i').className = 'fas fa-eye-slash';
            translationDivs.forEach(div => div.style.display = 'block');
        } else {
            translationToggle.querySelector('span').textContent = 'الترجمة';
            translationToggle.querySelector('i').className = 'fas fa-book';
            translationDivs.forEach(div => div.style.display = 'none');
        }
    }
    
    function toggleFont() {
        if (currentFont === 'Lateef') {
            ayahTexts.forEach(textElement => {
                textElement.classList.add('font-style-2');
            });
            currentFont = 'Scheherazade New';
            fontToggle.querySelector('span').textContent = 'تغيير الخط';
        } else {
            ayahTexts.forEach(textElement => {
                textElement.classList.remove('font-style-2');
            });
            currentFont = 'Lateef';
            fontToggle.querySelector('span').textContent = 'تغيير الخط';
        }
    }

    // --- Main Initialization Logic ---
    if (surahGrid && searchInput) {
        fetchAllSurahsAndInitializeSearch();
    }

    if (ayahContainer) {
        const surahNumber = parseInt(window.location.pathname.split('/').pop(), 10);
        let audio = null;
        let isAudioPlaying = false;

        document.querySelectorAll('.explain-button').forEach(button => {
            button.addEventListener('click', async () => {
                const ayahNumber = button.dataset.ayahNumber;
                const ayahDiv = document.getElementById(`ayah-${ayahNumber}`);
                const ayahText = ayahDiv.querySelector('.ayah-text span').textContent;
                const explanationDiv = document.getElementById(`explanation-${ayahNumber}`);
                
                if (explanationDiv.style.display === 'block') {
                    explanationDiv.style.display = 'none';
                } else {
                    await fetchAyahExplanation(ayahText, explanationDiv);
                }
            });
        });

        if (translationToggle) {
            translationToggle.addEventListener('click', async () => {
                if (!translationCache[surahNumber]) {
                    const ayahsWithTranslation = await fetchTranslation(surahNumber);
                    if (ayahsWithTranslation) {
                        document.querySelectorAll('.ayah-translation').forEach((div, index) => {
                            div.innerHTML = ayahsWithTranslation[index].text;
                        });
                    }
                }
                toggleTranslation();
            });
        }
        
        if (fontToggle) {
            fontToggle.addEventListener('click', toggleFont);
        }

        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                if (!audio) {
                    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahNumber}.mp3`;
                    audio = new Audio(audioUrl);
                    audio.addEventListener('ended', () => {
                        isAudioPlaying = false;
                        audioToggle.querySelector('i').className = 'fas fa-play';
                        audioToggle.querySelector('span').textContent = 'تشغيل الصوت';
                    });
                }
                if (isAudioPlaying) {
                    audio.pause();
                    isAudioPlaying = false;
                    audioToggle.querySelector('i').className = 'fas fa-play';
                    audioToggle.querySelector('span').textContent = 'تشغيل الصوت';
                } else {
                    audio.play();
                    isAudioPlaying = true;
                    audioToggle.querySelector('i').className = 'fas fa-stop';
                    audioToggle.querySelector('span').textContent = 'إيقاف الصوت';
                }
            });
        }
    }
});
