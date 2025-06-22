"""
Test script for the Vietnamese lyrics scraper
This script demonstrates how to use the NhacCuaTuiScraper class
"""

from lyrics_scraper import NhacCuaTuiScraper
import json

def test_single_song():
    """Test scraping a single song"""
    scraper = NhacCuaTuiScraper()
    
    # Test with one song from your list
    print("Testing single song search...")
    song_url = scraper.search_song("Sau Cơn Mưa", "RHYDER")
    
    if song_url:
        print(f"Found song URL: {song_url}")
        lyrics = scraper.get_lyrics(song_url)
        if lyrics:
            print("✓ Successfully extracted lyrics!")
            print(f"First 200 characters: {lyrics[:200]}...")
        else:
            print("✗ Could not extract lyrics from the page")
    else:
        print("✗ Song not found")

def test_parse_songs_file():
    """Test parsing the songs.txt file"""
    scraper = NhacCuaTuiScraper()
    
    print("\nTesting songs.txt parsing...")
    songs_data = scraper.parse_songs_file('songs.txt')
    
    print(f"Found {len(songs_data)} artists:")
    for artist, songs in songs_data.items():
        print(f"  {artist}: {len(songs)} songs")
        # Show first few songs
        for i, song in enumerate(songs[:3]):
            print(f"    {i+1}. {song}")
        if len(songs) > 3:
            print(f"    ... and {len(songs)-3} more")

def run_limited_scrape():
    """Run scraper on just a few songs for testing"""
    scraper = NhacCuaTuiScraper()
    
    print("\nRunning limited test scrape (first 2 songs from first artist)...")
    
    # Parse the full file
    songs_data = scraper.parse_songs_file('songs.txt')
    
    # Get first artist and first 2 songs
    first_artist = list(songs_data.keys())[0]
    test_songs = songs_data[first_artist][:2]
    
    results = {}
    results[first_artist] = {}
    
    for song in test_songs:
        print(f"Processing: {song} by {first_artist}")
        
        song_url = scraper.search_song(song, first_artist)
        if song_url:
            print(f"  Found URL: {song_url}")
            lyrics = scraper.get_lyrics(song_url)
            
            results[first_artist][song] = {
                'url': song_url,
                'lyrics': lyrics[:500] + "..." if lyrics and len(lyrics) > 500 else lyrics,  # Truncate for display
                'status': 'success' if lyrics else 'no_lyrics_found'
            }
        else:
            results[first_artist][song] = {
                'url': None,
                'lyrics': None,
                'status': 'not_found'
            }
        
        # Small delay to be respectful
        import time
        time.sleep(1)
    
    # Save test results
    with open('test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\nTest results saved to 'test_results.json'")
    return results

if __name__ == "__main__":
    print("Vietnamese Lyrics Scraper - Test Script")
    print("=" * 50)
    
    # Test 1: Parse songs file
    test_parse_songs_file()
    
    # Test 2: Single song search
    test_single_song()
    
    # Test 3: Limited scrape
    test_results = run_limited_scrape()
    
    print("\n" + "=" * 50)
    print("Test completed! To run the full scraper, use:")
    print("python lyrics_scraper.py")
