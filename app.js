// App state
let currentFilter = 'all';
let searchTimeout = null;
let isSearching = false;

// DOM elements
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const resultsList = document.getElementById('resultsList');
const popularSection = document.getElementById('popularSection');
const popularGrid = document.getElementById('popularGrid');
const artistsContainer = document.getElementById('artistsContainer');
const searchStats = document.getElementById('searchStats');
const resultsCount = document.getElementById('resultsCount');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const songModal = document.getElementById('songModal');
const modalClose = document.getElementById('modalClose');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Wait for data to load before showing popular songs
    setTimeout(showPopularSongs, 500);
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    // Clear button
    clearBtn.addEventListener('click', clearSearch);

    // Clear cache button
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearAppCache);
    }

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveFilter(e.target.dataset.filter);
            handleSearch();
        });
    });

    // Modal
    modalClose.addEventListener('click', closeModal);
    songModal.addEventListener('click', (e) => {
        if (e.target === songModal) closeModal();
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Prevent zoom on iOS when focusing input
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        searchInput.addEventListener('focus', () => {
            document.body.style.transform = 'scale(1)';
        });
    }
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    
    // Show/hide clear button
    clearBtn.style.display = query ? 'block' : 'none';
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // If empty query, show popular songs
    if (!query) {
        showPopularSongs();
        return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

// Perform search
async function performSearch(query) {
    if (isSearching) return;
    
    isSearching = true;
    showLoading();
    hidePopularSongs();
    
    try {
        // Wait for data to be loaded
        await new Promise(resolve => {
            const checkData = () => {
                if (Object.keys(lyricsData).length > 0) {
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            checkData();
        });
        
        const results = enhancedSearch(query, currentFilter);
        displaySearchResults(results, query);
        
    } catch (error) {
        console.error('Search error:', error);
        showNoResults();
    } finally {
        isSearching = false;
        hideLoading();
    }
}

// Display search results
function displaySearchResults(results, query) {
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    showSearchStats(results.length);
    
    // Group results by artist
    const resultsByArtist = {};
    results.forEach(song => {
        if (!resultsByArtist[song.artist]) {
            resultsByArtist[song.artist] = [];
        }
        resultsByArtist[song.artist].push(song);
    });
    
    // Sort artists alphabetically
    const sortedArtists = Object.keys(resultsByArtist).sort();
    
    resultsList.innerHTML = sortedArtists.map(artist => {
        const songs = resultsByArtist[artist];
        const artistImage = singerImages[artist] || 'https://via.placeholder.com/80x80?text=' + encodeURIComponent(artist);
        
        return `
            <div class="artist-section">
                <div class="artist-header" onclick="toggleSearchResultSection('${artist}')">
                    <img src="${artistImage}" alt="${artist}" 
                         onerror="this.src='https://via.placeholder.com/80x80?text=${encodeURIComponent(artist)}'">
                    <div class="artist-info">
                        <h3>${highlightText(artist, query)}</h3>
                        <div class="song-count">${songs.length} kết quả</div>
                    </div>
                    <div class="collapse-icon">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="songs-grid" id="search-songs-${artist.replace(/[^a-zA-Z0-9]/g, '')}" style="display: block;">
                    ${songs.map(song => {
                        const preview = getLyricsPreview(song.lyrics, 80);
                        return `
                            <div class="song-card" onclick="openSongModal('${song.title}', '${song.artist}')">
                                <h4>
                                    <i class="fas fa-music"></i>
                                    ${highlightText(song.title, query)}
                                </h4>
                                ${preview ? `<div class="song-preview">${highlightText(preview, query)}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    resultsList.style.display = 'block';
}

// Show popular songs
function showPopularSongs() {
    hideSearchResults();
    
    // Wait for data to load
    const showPopular = () => {
        if (Object.keys(lyricsData).length === 0) {
            setTimeout(showPopular, 100);
            return;
        }
        
        showAllSongsByArtist();
        popularSection.style.display = 'block';
    };
    
    showPopular();
}

// Show all songs grouped by artist
function showAllSongsByArtist() {
    const artistsWithSongs = {};
    let totalSongs = 0;
    
    // Group songs by artist
    for (const [artist, songs] of Object.entries(lyricsData)) {
        const validSongs = [];
        for (const [songTitle, songData] of Object.entries(songs)) {
            if (songData.status === 'success') {
                validSongs.push({
                    title: songTitle,
                    lyrics: songData.lyrics || '',
                    url: songData.url || '',
                    artist: artist
                });
                totalSongs++;
            }
        }
        
        if (validSongs.length > 0) {
            artistsWithSongs[artist] = validSongs;
        }
    }
    
    // Update total count
    const totalCountElement = document.getElementById('totalSongsCount');
    if (totalCountElement) {
        totalCountElement.textContent = `${totalSongs} bài hát • ${Object.keys(artistsWithSongs).length} ca sĩ`;
    }
    
    // Sort artists alphabetically
    const sortedArtists = Object.keys(artistsWithSongs).sort();
    
    artistsContainer.innerHTML = sortedArtists.map(artist => {
        const songs = artistsWithSongs[artist];
        const artistImage = singerImages[artist] || 'https://via.placeholder.com/80x80?text=' + encodeURIComponent(artist);
        
        return `
            <div class="artist-section collapsed">
                <div class="artist-header" onclick="toggleArtistSection('${artist}')">
                    <img src="${artistImage}" alt="${artist}" 
                         onerror="this.src='https://via.placeholder.com/80x80?text=${encodeURIComponent(artist)}'">
                    <div class="artist-info">
                        <h3>${artist}</h3>
                        <div class="song-count">${songs.length} bài hát</div>
                    </div>
                    <div class="collapse-icon">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                <div class="songs-grid" id="songs-${artist.replace(/[^a-zA-Z0-9]/g, '')}" style="display: none;">
                    ${songs.map(song => {
                        const preview = getLyricsPreview(song.lyrics, 80);
                        return `
                            <div class="song-card" onclick="openSongModal('${song.title}', '${song.artist}')">
                                <h4>
                                    <i class="fas fa-music"></i>
                                    ${song.title}
                                </h4>
                                ${preview ? `<div class="song-preview">${preview}</div>` : ''}

                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle artist section collapse/expand
function toggleArtistSection(artistName) {
    const cleanArtistName = artistName.replace(/[^a-zA-Z0-9]/g, '');
    const songsGrid = document.getElementById(`songs-${cleanArtistName}`);
    const artistSection = songsGrid.closest('.artist-section');
    const collapseIcon = artistSection.querySelector('.collapse-icon i');
    
    if (!songsGrid) return;
    
    const isCollapsed = songsGrid.style.display === 'none';
    
    if (isCollapsed) {
        // Expand
        songsGrid.style.display = 'grid';
        collapseIcon.className = 'fas fa-chevron-down';
        artistSection.classList.remove('collapsed');
        
        // Animate the expansion
        songsGrid.style.opacity = '0';
        songsGrid.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            songsGrid.style.transition = 'all 0.3s ease';
            songsGrid.style.opacity = '1';
            songsGrid.style.transform = 'translateY(0)';
        }, 10);
        
    } else {
        // Collapse
        songsGrid.style.transition = 'all 0.3s ease';
        songsGrid.style.opacity = '0';
        songsGrid.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            songsGrid.style.display = 'none';
            collapseIcon.className = 'fas fa-chevron-right';
            artistSection.classList.add('collapsed');
        }, 300);
    }
}

// Toggle search result section collapse/expand
function toggleSearchResultSection(artistName) {
    const cleanArtistName = artistName.replace(/[^a-zA-Z0-9]/g, '');
    const songsGrid = document.getElementById(`search-songs-${cleanArtistName}`);
    const artistSection = songsGrid.closest('.artist-section');
    const collapseIcon = artistSection.querySelector('.collapse-icon i');
    
    if (!songsGrid) return;
    
    const isCollapsed = songsGrid.style.display === 'none';
    
    if (isCollapsed) {
        // Expand
        songsGrid.style.display = 'grid';
        collapseIcon.className = 'fas fa-chevron-down';
        artistSection.classList.remove('collapsed');
        
        // Animate the expansion
        songsGrid.style.opacity = '0';
        songsGrid.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            songsGrid.style.transition = 'all 0.3s ease';
            songsGrid.style.opacity = '1';
            songsGrid.style.transform = 'translateY(0)';
        }, 10);
        
    } else {
        // Collapse
        songsGrid.style.transition = 'all 0.3s ease';
        songsGrid.style.opacity = '0';
        songsGrid.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            songsGrid.style.display = 'none';
            collapseIcon.className = 'fas fa-chevron-right';
            artistSection.classList.add('collapsed');
        }, 300);
    }
}

// Collapse all artist sections
function collapseAllArtists() {
    const artistSections = document.querySelectorAll('.artist-section');
    artistSections.forEach(section => {
        const artistName = section.querySelector('.artist-info h3').textContent;
        const cleanArtistName = artistName.replace(/[^a-zA-Z0-9]/g, '');
        const songsGrid = document.getElementById(`songs-${cleanArtistName}`);
        const collapseIcon = section.querySelector('.collapse-icon i');
        
        if (songsGrid && songsGrid.style.display !== 'none') {
            songsGrid.style.display = 'none';
            collapseIcon.className = 'fas fa-chevron-right';
            section.classList.add('collapsed');
        }
    });
}

// Expand all artist sections
function expandAllArtists() {
    const artistSections = document.querySelectorAll('.artist-section');
    artistSections.forEach(section => {
        const artistName = section.querySelector('.artist-info h3').textContent;
        const cleanArtistName = artistName.replace(/[^a-zA-Z0-9]/g, '');
        const songsGrid = document.getElementById(`songs-${cleanArtistName}`);
        const collapseIcon = section.querySelector('.collapse-icon i');
        
        if (songsGrid && songsGrid.style.display === 'none') {
            songsGrid.style.display = 'grid';
            collapseIcon.className = 'fas fa-chevron-down';
            section.classList.remove('collapsed');
        }
    });
}

// Set active filter
function setActiveFilter(filter) {
    currentFilter = filter;
    
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    currentFilter = 'all';
    setActiveFilter('all');
    showPopularSongs();
}

// Clear app cache
async function clearAppCache() {
    try {
        // Show loading state
        clearCacheBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xóa...';
        clearCacheBtn.disabled = true;
        
        // Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        // Clear service worker registration
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
                registrations.map(registration => registration.unregister())
            );
        }
        
        // Clear local storage and session storage
        if (typeof Storage !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
        
        // Success feedback
        clearCacheBtn.innerHTML = '<i class="fas fa-check"></i> Đã xóa!';
        clearCacheBtn.style.background = 'linear-gradient(45deg, #00d4aa, #00b894)';
        
        // Show success message
        showCacheMessage('Cache đã được xóa thành công! Trang sẽ tự động tải lại.', 'success');
        
        // Reload page after delay
        setTimeout(() => {
            window.location.reload(true);
        }, 2000);
        
    } catch (error) {
        console.error('Error clearing cache:', error);
        
        // Error feedback
        clearCacheBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Lỗi';
        clearCacheBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        
        showCacheMessage('Có lỗi xảy ra khi xóa cache. Hãy thử lại.', 'error');
        
        // Reset button after delay
        setTimeout(() => {
            clearCacheBtn.innerHTML = '<i class="fas fa-broom"></i> Xóa cache';
            clearCacheBtn.style.background = 'linear-gradient(45deg, #FF9F43, #FF6B6B)';
            clearCacheBtn.disabled = false;
        }, 3000);
    }
}

// Show cache operation message
function showCacheMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.cache-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `cache-message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Show with animation
    setTimeout(() => messageDiv.classList.add('show'), 100);
    
    // Auto remove after delay
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Show/hide UI elements
function showLoading() {
    loading.style.display = 'block';
    hideSearchResults();
    hideNoResults();
}

function hideLoading() {
    loading.style.display = 'none';
}

function showSearchStats(count) {
    resultsCount.textContent = count.toLocaleString('vi-VN');
    searchStats.style.display = 'block';
}

function hideSearchStats() {
    searchStats.style.display = 'none';
}

function showNoResults() {
    hideSearchStats();
    hideSearchResults();
    noResults.style.display = 'block';
}

function hideNoResults() {
    noResults.style.display = 'none';
}

function showSearchResults() {
    hidePopularSongs();
    hideNoResults();
    resultsList.style.display = 'grid';
}

function hideSearchResults() {
    resultsList.style.display = 'none';
    hideSearchStats();
}

function hidePopularSongs() {
    popularSection.style.display = 'none';
}

// Modal functions
function openSongModal(title, artist) {
    const song = getAllSongs().find(s => s.title === title && s.artist === artist);
    if (!song) return;
    
    document.getElementById('modalSongTitle').textContent = song.title;
    document.getElementById('modalLyrics').textContent = song.lyrics || 'Lời bài hát không có sẵn.';
    
    songModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    songModal.style.display = 'none';
    document.body.style.overflow = '';
}

// PWA functionality
let deferredPrompt;

// Debug PWA installability
console.log('PWA Debug: Script loaded');

// Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('PWA Debug: App is already installed');
} else {
    console.log('PWA Debug: App is not installed');
}

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA Debug: beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
        console.log('PWA Debug: Install button shown');
    } else {
        console.log('PWA Debug: Install button not found');
    }
    
    installBtn.addEventListener('click', async () => {
        console.log('PWA Debug: Install button clicked');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    });
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
});

// Additional debug info
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        console.log('PWA Debug: Service Worker supported');
    } else {
        console.log('PWA Debug: Service Worker not supported');
    }
    
    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        console.log('PWA Debug: Manifest link found:', manifestLink.href);
    } else {
        console.log('PWA Debug: Manifest link not found');
    }
    
    // Force show install button for testing (remove this in production)
    setTimeout(() => {
        const installBtn = document.getElementById('installBtn');
        if (installBtn && installBtn.style.display === 'none') {
            console.log('PWA Debug: Forcing install button to show for testing');
            installBtn.style.display = 'flex';
            installBtn.style.opacity = '0.5'; // Make it semi-transparent to indicate it's forced
            installBtn.title = 'Test mode - PWA criteria not met';
        }
    }, 2000);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // Ctrl/Cmd + / to clear search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        clearSearch();
    }
    
    // Ctrl/Cmd + E to expand all
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        expandAllArtists();
    }
    
    // Ctrl/Cmd + C to collapse all
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !searchInput.contains(document.activeElement)) {
        e.preventDefault();
        collapseAllArtists();
    }
    
    // Show keyboard shortcuts hint
    if (e.key === '?' && !searchInput.contains(document.activeElement)) {
        e.preventDefault();
        showKeyboardShortcuts();
    }
});

// Show keyboard shortcuts hint
function showKeyboardShortcuts() {
    const hint = document.getElementById('shortcutsHint');
    if (hint) {
        hint.classList.add('show');
        setTimeout(() => {
            hint.classList.remove('show');
        }, 4000);
    }
}

// Show shortcuts hint when the page loads
setTimeout(() => {
    showKeyboardShortcuts();
}, 3000);

// Add search placeholder animation
function animateSearchPlaceholder() {
    const placeholders = [
        'Tìm kiếm bài hát, ca sĩ, lời bài hát...',
        'Thử tìm "Sau cơn mưa" của RHYDER...',
        'Khám phá âm nhạc mơ màng...',
        'Tìm những giai điệu của thành phố...',
        'Tìm lời bài hát "thành phố mơ màng"...'
    ];
    
    let currentIndex = 0;
    
    setInterval(() => {
        if (document.activeElement !== searchInput && !searchInput.value) {
            currentIndex = (currentIndex + 1) % placeholders.length;
            searchInput.placeholder = placeholders[currentIndex];
        }
    }, 3000);
}

// Start placeholder animation
setTimeout(animateSearchPlaceholder, 2000);

// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Add touch feedback for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.artist-section, .popular-item, .song-card, .filter-btn, .install-btn, .control-btn, .artist-header')) {
            e.target.style.opacity = '0.8';
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('.artist-section, .popular-item, .song-card, .filter-btn, .install-btn, .control-btn, .artist-header')) {
            setTimeout(() => {
                e.target.style.opacity = '';
            }, 150);
        }
    });
}
