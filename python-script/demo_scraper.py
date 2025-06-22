"""
Demo script - scrapes lyrics for just the first 5 songs to demonstrate functionality
"""

from lyrics_scraper import NhacCuaTuiScraper
import json

def run_demo():
    scraper = NhacCuaTuiScraper()
    
    # Parse all songs
    all_songs = scraper.parse_songs_file('songs.txt')
    
    # Take only first artist and first 3 songs for demo
    demo_data = {}
    artists = list(all_songs.keys())
    
    # Get first 2 artists, 2-3 songs each
    for i, artist in enumerate(artists[:2]):
        songs_to_scrape = all_songs[artist][:3 if i == 0 else 2]
        demo_data[artist] = songs_to_scrape
    
    print("Demo: Scraping lyrics for a few songs...")
    print(f"Artists: {list(demo_data.keys())}")
    for artist, songs in demo_data.items():
        print(f"  {artist}: {songs}")
    
    # Run scraper on demo data
    results = {}
    
    for artist, songs in demo_data.items():
        print(f"\n--- Processing {artist} ---")
        results[artist] = {}
        
        for song in songs:
            print(f"Searching: {song}")
            
            # Search for song
            url = scraper.search_song(song, artist)
            
            if url:
                print(f"  ✓ Found: {url}")
                lyrics = scraper.get_lyrics(url)
                
                if lyrics:
                    results[artist][song] = {
                        'url': url,
                        'lyrics': lyrics,
                        'status': 'success',
                        'preview': lyrics[:200] + "..." if len(lyrics) > 200 else lyrics
                    }
                    print(f"  ✓ Lyrics extracted ({len(lyrics)} characters)")
                else:
                    results[artist][song] = {
                        'url': url,
                        'lyrics': None,
                        'status': 'no_lyrics_found'
                    }
                    print("  ✗ No lyrics found on page")
            else:
                results[artist][song] = {
                    'url': None,
                    'lyrics': None,
                    'status': 'not_found'
                }
                print("  ✗ Song not found")
            
            # Small delay
            import time
            time.sleep(1)
    
    # Save demo results
    with open('demo_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*50}")
    print("Demo completed! Results saved to 'demo_results.json'")
    
    # Print summary
    total_attempted = sum(len(songs) for songs in demo_data.values())
    successful = sum(1 for artist_songs in results.values() 
                    for song_data in artist_songs.values() 
                    if song_data['status'] == 'success')
    
    print(f"Success rate: {successful}/{total_attempted} songs")
    
    # Show a sample result
    for artist, songs in results.items():
        for song, data in songs.items():
            if data['status'] == 'success' and 'preview' in data:
                print(f"\nSample lyrics from '{song}' by {artist}:")
                print(f"'{data['preview']}'")
                break
        break

if __name__ == "__main__":
    run_demo()
