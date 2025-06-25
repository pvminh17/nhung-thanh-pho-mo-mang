// App state
let currentFilter = 'all';
let searchTimeout = null;
let isSearching = false;

// Header scroll behavior
let lastScrollTop = 0;
let scrollThreshold = 100;
let isHeaderVisible = true;

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
const header = document.querySelector('.header');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupHeaderScrollBehavior();
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

// Setup header scroll behavior
function setupHeaderScrollBehavior() {
    let ticking = false;
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Always show header at the top
        if (scrollTop <= scrollThreshold) {
            showHeader();
            lastScrollTop = scrollTop;
            ticking = false;
            return;
        }
        
        // Show/hide header based on scroll direction
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            // Scrolling down - hide header
            hideHeader();
        } else if (scrollTop < lastScrollTop) {
            // Scrolling up - show header
            showHeader();
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    // Add scroll listener
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Show header when search input is focused
    if (searchInput) {
        searchInput.addEventListener('focus', showHeader);
    }
    
    // Show header when modal is opened
    if (songModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const display = songModal.style.display;
                    if (display === 'block') {
                        showHeader();
                    }
                }
            });
        });
        
        observer.observe(songModal, { attributes: true });
    }
}

// Show header
function showHeader() {
    if (!isHeaderVisible && header) {
        header.classList.remove('hidden');
        header.classList.add('show');
        isHeaderVisible = true;
    }
}

// Hide header
function hideHeader() {
    if (isHeaderVisible && header) {
        header.classList.remove('show');
        header.classList.add('hidden');
        isHeaderVisible = false;
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
    
    // Format lyrics for better readability
    const lyricsElement = document.getElementById('modalLyrics');
    const rawLyrics = song.lyrics || 'Lời bài hát không có sẵn.';
      if (rawLyrics === 'Lời bài hát không có sẵn.') {
        lyricsElement.textContent = rawLyrics;
    } else {
        // Format the lyrics with proper line breaks and spacing
        const lines = rawLyrics
            // Split by various line break patterns
            .split(/[\r\n]+/)
            // Remove empty lines at the beginning and end
            .map(line => line.trim())
            // Filter out completely empty lines but keep lines with just spaces
            .filter(line => line.length > 0);
          // Create formatted HTML with alternating colors for each line
        const formattedHTML = lines.map((line, index) => {
            // Define color classes for alternating lines
            const colorClass = index % 5 === 0 ? 'lyrics-line-1' : 
                              index % 5 === 1 ? 'lyrics-line-2' : 
                              index % 5 === 2 ? 'lyrics-line-3' : 
                              index % 5 === 3 ? 'lyrics-line-4' : 'lyrics-line-5';
            
            // Check if this line starts a new verse (after punctuation)
            const isNewVerse = index > 0 && /[.!?]$/.test(lines[index - 1]);
            const marginClass = isNewVerse ? 'lyrics-verse-break' : '';
            
            return `<div class="lyrics-line ${colorClass} ${marginClass}">${line}</div>`;
        }).join('');
        
        // Use innerHTML with colored lines
        lyricsElement.innerHTML = formattedHTML;
        
        // Add CSS styles if not already added
        if (!document.getElementById('lyrics-styles')) {
            const style = document.createElement('style');
            style.id = 'lyrics-styles';
            style.textContent = `
                .lyrics-line {
                    line-height: 1.6;
                    padding: 2px 0;
                    transition: all 0.2s ease;
                }
                
                .lyrics-line-1 { color: #e2e8f0; } /* Light Gray */
                .lyrics-line-2 { color: #a7f3d0; } /* Light Green */
                .lyrics-line-3 { color: #fde68a; } /* Light Yellow */
                .lyrics-line-4 { color: #bfdbfe; } /* Light Blue */
                .lyrics-line-5 { color: #fbb6ce; } /* Light Pink */
                .lyrics-verse-break {
                    margin-top: 12px;
                }
                .lyrics-line {
                    cursor: pointer;
                }
                .lyrics-line:active {
                    transform: scale(0.98);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
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

// Function to check if app is installed and hide button accordingly
function checkAndHideInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;
    
    // Check if app is running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA Debug: App is running in standalone mode (installed)');
        installBtn.style.display = 'none';
        return true;
    }
    
    // Check if app is installed via navigator (iOS Safari)
    if (window.navigator.standalone === true) {
        console.log('PWA Debug: App is installed (iOS standalone)');
        installBtn.style.display = 'none';
        return true;
    }
    
    console.log('PWA Debug: App is not installed');
    return false;
}

// Function to detect Safari iOS and show install instructions
function detectSafariIOSAndShowButton() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isInstalled = window.navigator.standalone === true;
    
    console.log('PWA Debug: Safari iOS detection', { isSafari, isIOS, isInstalled });
    
    if (isIOS && isSafari && !isInstalled) {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex';
            console.log('PWA Debug: Install button shown for Safari iOS');
            
            // Add click handler for Safari iOS
            installBtn.addEventListener('click', () => {
                showSafariInstallGuide();
            });
        }
        return true;
    }
    return false;
}

// Show Safari-specific install guide
function showSafariInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'install-guide-modal show';
    modal.innerHTML = `
        <div class="install-guide-content">
            <div class="install-guide-header">
                <h3>📱 Cài đặt ứng dụng trên Safari</h3>
                <button class="install-guide-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="install-guide-body">
                <div class="browser-status">
                    <p>🍎 Bạn đang sử dụng Safari trên iOS!</p>
                </div>
                
                <div class="install-benefits">
                    <h4>Để cài đặt ứng dụng:</h4>
                    <ul>
                        <li>1️⃣ Nhấn nút <strong>Chia sẻ</strong> (📤) ở dưới cùng</li>
                        <li>2️⃣ Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong></li>
                        <li>3️⃣ Nhấn <strong>"Thêm"</strong> để hoàn tất</li>
                    </ul>
                </div>
                
                <div class="install-actions">
                    <button class="install-proceed-btn" onclick="this.closest('.install-guide-modal').remove();">
                        <i class="fas fa-check"></i>
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add close functionality
    const closeBtn = modal.querySelector('.install-guide-close');
    const proceedBtn = modal.querySelector('.install-proceed-btn');
    
    closeBtn.onclick = () => modal.remove();
    proceedBtn.onclick = () => modal.remove();
    
    // Close on backdrop click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    document.body.appendChild(modal);
}

// Check install status on load
window.addEventListener('load', () => {
    // First check if already installed
    if (!checkAndHideInstallButton()) {
        // If not installed, check if it's Safari iOS and show button
        if (!detectSafariIOSAndShowButton()) {
            // For other browsers, wait for beforeinstallprompt
            console.log('PWA Debug: Waiting for beforeinstallprompt event');
        }
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA Debug: beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    
    // Only show button if app is not already installed
    if (!checkAndHideInstallButton()) {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex';
            installBtn.style.opacity = '1'; // Reset opacity
            installBtn.title = 'Install app'; // Reset title
            console.log('PWA Debug: Install button shown');
            
            // Show browser compatibility guide
            showInstallGuide();
        } else {
            console.log('PWA Debug: Install button not found');
        }
        
        // Remove any existing click listeners to avoid duplicates
        const newInstallBtn = installBtn.cloneNode(true);
        installBtn.parentNode.replaceChild(newInstallBtn, installBtn);
        
        newInstallBtn.addEventListener('click', async () => {
            console.log('PWA Debug: Install button clicked');
            
            // Show install guide before proceeding
            const shouldProceed = await showInstallConfirmation();
            if (!shouldProceed) return;
            
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                if (outcome === 'accepted') {
                    console.log('PWA Debug: User accepted install prompt');
                }
                deferredPrompt = null;
                newInstallBtn.style.display = 'none';
            }
        });
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    // Store install status in localStorage for future sessions
    localStorage.setItem('pwa-installed', 'true');
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
    
    // Check if app was previously installed (stored in localStorage)
    if (localStorage.getItem('pwa-installed') === 'true') {
        console.log('PWA Debug: App was previously installed');
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
    
    // Log browser and platform info
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone;
    
    console.log('PWA Debug: Browser info', {
        userAgent: navigator.userAgent,
        isSafari,
        isIOS,
        isStandalone,
        supportsBeforeInstallPrompt: 'BeforeInstallPromptEvent' in window
    });
});

// Show install guide notification
function showInstallGuide() {
    // Don't show if user has already seen it
    if (localStorage.getItem('install-guide-shown') === 'true') return;
    
    const userAgent = navigator.userAgent.toLowerCase();
    let browserName = 'trình duyệt';
    let isSupported = true;
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        browserName = 'Chrome';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browserName = 'Safari';
    } else if (userAgent.includes('firefox')) {
        browserName = 'Firefox';
        isSupported = false;
    } else if (userAgent.includes('edg')) {
        browserName = 'Edge';
    }
    
    setTimeout(() => {
        showInstallGuideMessage(browserName, isSupported);
        localStorage.setItem('install-guide-shown', 'true');
    }, 1000);
}

// Show install guide message
function showInstallGuideMessage(browserName, isSupported) {
    const message = isSupported 
        ? `🎉 Tuyệt vời! Bạn đang sử dụng ${browserName} - trình duyệt hỗ trợ cài đặt ứng dụng tốt!`
        : `💡 Để cài đặt ứng dụng tốt hơn, hãy sử dụng Chrome hoặc Safari thay vì ${browserName}.`;
    
    const type = isSupported ? 'success' : 'info';
    
    // showCacheMessage(message, type);
}

// Show install confirmation with browser guide
function showInstallConfirmation() {
    return new Promise((resolve) => {
        const userAgent = navigator.userAgent.toLowerCase();
        let browserInfo = '';
        let isOptimal = true;
        
        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            browserInfo = '✅ Chrome - Hỗ trợ cài đặt NTPMM!';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            browserInfo = '✅ Safari - Hỗ trợ cài đặt NTPMM!';
        } else if (userAgent.includes('edg')) {
            browserInfo = '✅ Edge - Hỗ trợ cài đặt NTPMM!';
        } else {
            browserInfo = '⚠️ Để trải nghiệm tốt nhất, hãy sử dụng Chrome hoặc Safari';
            isOptimal = false;
        }
        
        const modal = document.createElement('div');
        modal.className = 'install-guide-modal';
        modal.innerHTML = `
            <div class="install-guide-content">
                <div class="install-guide-header">
                    <h3>📱 Cài đặt ứng dụng</h3>
                    <button class="install-guide-close" onclick="this.closest('.install-guide-modal').remove(); arguments[0].resolve(false);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="install-guide-body">
                    <div class="browser-status">
                        <p>${browserInfo}</p>
                    </div>
                    
                    <div class="install-benefits">
                        <ul>
                            <li>🚀 Mở nhanh hơn từ màn hình chính</li>
                            <li>📱 Trải nghiệm như ứng dụng native</li>
                            <li>🔄 Hoạt động offline</li>
                            <li>🔔 Nhận thông báo cập nhật</li>
                        </ul>
                    </div>
                    
                    ${!isOptimal ? `
                        <div class="browser-recommendation">
                            <h4>💡 Khuyến nghị:</h4>
                            <p>Để cài đặt và sử dụng tốt nhất, hãy mở trang này bằng:</p>
                            <ul>
                                <li>🌐 <strong>Chrome</strong> (Android/Desktop)</li>
                                <li>🍎 <strong>Safari</strong> (iOS/Mac)</li>
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="install-actions">
                        ${isOptimal ? `
                            <button class="install-proceed-btn" onclick="this.closest('.install-guide-modal').remove(); arguments[0].resolve(true);">
                                <i class="fas fa-download"></i>
                                Tiếp tục cài đặt
                            </button>
                        ` : `
                            <button class="install-proceed-btn secondary" onclick="this.closest('.install-guide-modal').remove(); arguments[0].resolve(true);">
                                <i class="fas fa-download"></i>
                                Vẫn muốn cài đặt
                            </button>
                        `}
                        <button class="install-cancel-btn" onclick="this.closest('.install-guide-modal').remove(); arguments[0].resolve(false);">
                            Để sau
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handlers with resolve function
        const proceedBtn = modal.querySelector('.install-proceed-btn');
        const cancelBtn = modal.querySelector('.install-cancel-btn');
        const closeBtn = modal.querySelector('.install-guide-close');
        
        if (proceedBtn) {
            proceedBtn.onclick = () => {
                modal.remove();
                resolve(true);
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(false);
            };
        }
        
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.remove();
                resolve(false);
            };
        }
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
        
        document.body.appendChild(modal);
        
        // Show with animation
        setTimeout(() => modal.classList.add('show'), 10);
    });
}

// Update cache message function to support info type
function showCacheMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.cache-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `cache-message ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${icon}"></i>
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
    }, type === 'info' ? 6000 : 4000); // Show info messages longer
}

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
