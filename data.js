// Convert existing data to the format needed by the app
const singerImages = {
    "RHYDER": "https://media-cdn-v2.laodong.vn/storage/newsportal/2024/12/10/1433472/Rhyder-6.jpg",
    "OBITO": "https://images2.thanhnien.vn/528068263637045248/2023/10/12/bia-dia-co-su-gop-mat-cua-em-trai-obito-the-hien-cau-chuyen-ve-su-truong-thanh-anh-obito-16970846048781054579233.jpg",
    "SHIKI": "https://bizweb.dktcdn.net/100/411/628/products/shiki.jpg?v=1721198170180",
    "DƯƠNG DOMIC": "https://yt3.googleusercontent.com/Scnb6zniVBsy8eT2v01XP8xUN_DhlSuDie_ohDbfkpUkPhkl4DzP6PYzrnqPhnJ7HsktuYTjP1Y=s900-c-k-c0x00ffffff-no-rj",
    "CHILLIES": "https://trixie.com.vn/media/images/article/98645721/1595414808364_600.jpg",
    "THẮNG": "https://kenh14cdn.com/203336854389633024/2024/6/3/photo-1-1717388809388946455358.jpg",
    "WRXDIE": "https://5sfashion.vn/storage/upload/images/ckeditor/qd0MYUHTHW62dst9VGCkdgYKJ9nfBXapdpoEO4RS.png",
    "HOÀNG DŨNG": "https://thanhnien.mediacdn.vn/Uploaded/hienth/2022_07_27/plt52-6046.jpg",
    "JUSTATEE": "https://kenh14cdn.com/2018/12/15/justatee-3-15448105252001980009978.jpg",
    "HIEUTHUHAI": "https://liembarbershop.com/wp-content/uploads/2024/07/hieuthuhai-1.jpg",
    "HURRYKNG": "https://lh7-rt.googleusercontent.com/docsz/AD_4nXdrV-pJQniMplSzIEIkh-67qzGAr8Vb68zGkM4oHQKt2sEzkkhnM-sImwCFPLvgmNWQ-xU7-6hzfT_y6nZtsfAAdmA4b0GU2rXIrSzVGsKBGUNtHFnRUtJyRssM0WXl0heg8JnR?key=j9lT5PED5L0EudxAdP3Yffv6"
};

// Make singerImages globally accessible
window.singerImages = singerImages;

// This will be populated with lyrics data from vietnamese_lyrics.json
let lyricsData = {};

// Load lyrics data
async function loadLyricsData() {
    try {
        const response = await fetch('vietnamese_lyrics.json');
        lyricsData = await response.json();
        console.log('Lyrics data loaded successfully');
    } catch (error) {
        console.error('Error loading lyrics data:', error);
        // Fallback data structure
        lyricsData = {
            "RHYDER": {
                "Sau Cơn Mưa": {
                    "url": "https://www.nhaccuatui.com/bai-hat/sau-con-mua-.Zj06lwSWKcGs.html",
                    "lyrics": "Nhìn em đẹp hơn khi nở nụ cười trên môi...",
                    "status": "success"
                }
            }
        };
    }
}

// Get all songs with their data
function getAllSongs() {
    const songs = [];
    
    for (const [artist, artistSongs] of Object.entries(lyricsData)) {
        for (const [songTitle, songData] of Object.entries(artistSongs)) {
            if (songData.status === 'success') {
                songs.push({
                    title: songTitle,
                    artist: artist,
                    lyrics: songData.lyrics || '',
                    url: songData.url || '',
                    artistImage: singerImages[artist] || 'https://via.placeholder.com/150x150?text=No+Image'
                });
            }
        }
    }
    
    return songs;
}

// Get popular songs (songs with more lyrics content)
function getPopularSongs(limit = 6) {
    const allSongs = getAllSongs();
    
    // Sort by lyrics length as a proxy for popularity
    return allSongs
        .filter(song => song.lyrics && song.lyrics.length > 100)
        .sort((a, b) => b.lyrics.length - a.lyrics.length)
        .slice(0, limit);
}

// Search functionality
function searchSongs(query, filter = 'all') {
    if (!query.trim()) return [];
    
    const allSongs = getAllSongs();
    const searchTerm = query.toLowerCase().trim();
    
    return allSongs.filter(song => {
        const titleMatch = song.title.toLowerCase().includes(searchTerm);
        const artistMatch = song.artist.toLowerCase().includes(searchTerm);
        const lyricsMatch = song.lyrics.toLowerCase().includes(searchTerm);
        
        switch (filter) {
            case 'song':
                return titleMatch;
            case 'artist':
                return artistMatch;
            case 'lyrics':
                return lyricsMatch;
            case 'all':
            default:
                return titleMatch || artistMatch || lyricsMatch;
        }
    }).slice(0, 50); // Limit results for performance
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Get lyrics preview (first few lines)
function getLyricsPreview(lyrics, maxLength = 100) {
    if (!lyrics) return '';
    
    const cleanLyrics = lyrics.replace(/\[.*?\]/g, '').trim(); // Remove tags like [MINH$U:]
    const lines = cleanLyrics.split('\n').filter(line => line.trim());
    
    let preview = '';
    for (const line of lines) {
        if (preview.length + line.length > maxLength) break;
        preview += line + '\n';
    }
    
    return preview.trim() || cleanLyrics.substring(0, maxLength) + '...';
}

// Remove Vietnamese diacritics for better search
function removeDiacritics(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

// Enhanced search with diacritics support
function enhancedSearch(query, filter = 'all') {
    if (!query.trim()) return [];
    
    const allSongs = getAllSongs();
    const searchTerm = removeDiacritics(query.toLowerCase().trim());
    
    return allSongs.filter(song => {
        const titleMatch = removeDiacritics(song.title.toLowerCase()).includes(searchTerm);
        const artistMatch = removeDiacritics(song.artist.toLowerCase()).includes(searchTerm);
        const lyricsMatch = removeDiacritics(song.lyrics.toLowerCase()).includes(searchTerm);
        
        switch (filter) {
            case 'song':
                return titleMatch;
            case 'artist':
                return artistMatch;
            case 'lyrics':
                return lyricsMatch;
            case 'all':
            default:
                return titleMatch || artistMatch || lyricsMatch;
        }
    }).slice(0, 50);
}

// Initialize data when the script loads
loadLyricsData();
