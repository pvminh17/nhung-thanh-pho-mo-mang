# Những Thành Phố Mơ Màng - Vietnamese Music Search PWA

A Progressive Web App (PWA) for discovering dreamy Vietnamese songs that capture the essence of cities and urban life. Experience music with a mobile-first, aesthetically pleasing interface inspired by the poetry of urban landscapes.

## Features

- 🔍 **Smart Search**: Search by song name, artist, or lyrics content
- 🎵 **Comprehensive Database**: Vietnamese songs with complete lyrics
- 📱 **Mobile First**: Optimized for mobile devices with responsive design
- � **Dreamy Interface**: Beautiful, atmospheric design inspired by urban landscapes
- � **Curated Collection**: Vietnamese songs that capture the essence of city life and dreams
- 🌃 **Urban Poetry**: Discover music that tells stories of modern Vietnamese cities
- 🌙 **Dark Mode**: Automatic dark mode support based on system preference

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PWA**: Service Worker, Web App Manifest
- **Data**: JSON-based Vietnamese lyrics database
- **Styling**: CSS Grid, Flexbox, CSS animations
- **Icons**: Font Awesome, custom PWA icons

## Installation

### Option 1: Install as PWA (Recommended)
1. Open the app in a modern browser (Chrome, Firefox, Safari, Edge)
2. Look for the "Install" button in the header
3. Click "Install" to add the app to your home screen

### Option 2: Local Development
1. Clone this repository
2. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # Styles and responsive design
├── app.js             # Main application logic
├── data.js            # Data handling and search functionality
├── sw.js              # Service Worker for PWA features
├── sw-register.js     # Service Worker registration
├── manifest.json      # PWA manifest
├── vietnamese_lyrics.json  # Vietnamese songs database
├── singer-image.js    # Artist images mapping
├── generate_icons.py  # Icon generation script
├── icons/             # PWA icons directory
└── README.md          # This file
```

## Features in Detail

### Search Functionality
- **Real-time search** with debouncing for performance
- **Multiple filters**: All, Songs, Artists, Lyrics
- **Vietnamese text support** with diacritics normalization
- **Search highlighting** in results
- **Smart suggestions** with rotating placeholders

### Mobile Optimization
- Touch-friendly interface with haptic feedback
- Optimized for portrait orientation
- Prevents zoom on iOS devices
- Responsive grid layouts
- Fast tap responses

### PWA Features
- **Offline support** with Service Worker caching
- **Installable** on mobile and desktop
- **App shortcuts** for quick access
- **Background sync** ready for future features
- **Push notifications** support (future feature)

### User Experience
- **Smooth animations** and transitions
- **Loading states** and skeleton screens
- **Error handling** with friendly messages
- **Keyboard shortcuts** (Ctrl+K for search, Ctrl+/ to clear)
- **Accessibility** features

## Data Sources

The app uses a comprehensive database of Vietnamese songs including:
- Popular Vietnamese artists (RHYDER, OBITO, SHIKI, etc.)
- Complete lyrics for hundreds of songs
- Artist images and song URLs
- Metadata for enhanced search

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Songs
To add new songs to the database:
1. Update `vietnamese_lyrics.json` with new song data
2. Add artist images to `singer-image.js` if needed
3. Test the search functionality

## Performance

- **Lightweight**: ~500KB total bundle size
- **Fast search**: Results in <100ms for most queries
- **Efficient caching**: Resources cached for offline use
- **Optimized images**: WebP support with fallbacks

## Security

- **CSP headers** recommended for production
- **HTTPS required** for PWA features
- **No external tracking** - privacy-focused

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Vietnamese music community for the inspiration
- Artists and lyrics sources
- Font Awesome for icons
- Google Fonts for typography

## Future Features

- [ ] Playlist creation and management
- [ ] Favorite songs bookmarking
- [ ] Song recommendations
- [ ] Social sharing
- [ ] Audio player integration
- [ ] Lyrics synchronization
- [ ] User accounts and sync
- [ ] Advanced search filters
- [ ] Song history tracking
- [ ] Export/import functionality

---

Made with ✨ for dreamers and city lovers
