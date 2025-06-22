# Vietnamese Lyrics Scraper

This Python script scrapes song lyrics from www.nhaccuatui.com based on a list of Vietnamese songs and artists.

## Features

- Parses song lists from a text file
- Searches for songs on NhacCuaTui.com
- Extracts lyrics from song pages
- Outputs results in JSON format
- Handles Vietnamese text encoding properly
- Includes error handling and respectful rate limiting

## Requirements

Install the required packages:

```bash
pip install -r requirements.txt
```

Or manually install:
```bash
pip install requests beautifulsoup4 lxml
```

## Usage

### Quick Start

1. Make sure your `songs.txt` file is in the correct format (see below)
2. Run the scraper:

```bash
python lyrics_scraper.py
```

3. Results will be saved to `vietnamese_lyrics.json`

### Testing

Run the test script to verify everything works:

```bash
python test_scraper.py
```

This will:
- Parse your songs.txt file
- Test searching for a single song
- Run a limited scrape on the first few songs

## Input Format (songs.txt)

The script expects a text file with the following format:

```
CA SĨ I: ARTIST_NAME
1 Song Title 1
2 Song Title 2
3 Song Title 3

CA SĨ II: ANOTHER_ARTIST
1 Another Song
2 Yet Another Song
```

## Output Format

The script generates a JSON file with the following structure:

```json
{
  "ARTIST_NAME": {
    "Song Title": {
      "url": "https://www.nhaccuatui.com/bai-hat/...",
      "lyrics": "Song lyrics here...",
      "status": "success"
    },
    "Another Song": {
      "url": null,
      "lyrics": null,
      "status": "not_found"
    }
  }
}
```

## Status Values

- `"success"`: Lyrics found and extracted successfully
- `"not_found"`: Song could not be found on the website
- `"no_lyrics_found"`: Song page found but no lyrics available

## Features

### Robust Search
- Searches using both song title and artist name
- Handles Vietnamese characters properly
- Multiple fallback strategies for finding lyrics

### Respectful Scraping
- 1-second delay between requests
- Proper user agent headers
- Error handling to prevent crashes

### Flexible Parsing
- Multiple CSS selectors for lyrics extraction
- Handles different page layouts
- Text cleaning and formatting

## Customization

You can modify the scraper by:

1. **Changing output filename**:
   ```python
   scraper.scrape_all_lyrics('songs.txt', 'my_lyrics.json')
   ```

2. **Adjusting delay between requests**:
   ```python
   time.sleep(2)  # Change from 1 to 2 seconds
   ```

3. **Adding more lyrics selectors**:
   ```python
   lyrics_selectors = [
       '.lyrics-content',
       '.lyric',
       '.your-custom-selector'
   ]
   ```

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure all packages are installed
2. **Encoding issues**: Ensure your songs.txt file is saved as UTF-8
3. **No results found**: Some songs might not be available on the website
4. **Rate limiting**: The script includes delays, but you can increase them if needed

### Debug Mode

For debugging, you can run individual functions:

```python
from lyrics_scraper import NhacCuaTuiScraper

scraper = NhacCuaTuiScraper()

# Test parsing
songs = scraper.parse_songs_file('songs.txt')
print(songs)

# Test single search
url = scraper.search_song('Song Title', 'Artist Name')
print(url)
```

## Legal Notice

This scraper is for educational purposes. Please:
- Respect the website's terms of service
- Don't overload the server with too many requests
- Use the lyrics for personal/educational purposes only
- Consider supporting the artists and the website

## Statistics from Your Songs List

Based on your `songs.txt` file:
- **11 artists**
- **111 total songs**
- Popular artists: HIEUTHUHAI (17 songs), WRXDIE (13 songs)

Estimated scraping time: ~2-3 minutes (with 1-second delays)
