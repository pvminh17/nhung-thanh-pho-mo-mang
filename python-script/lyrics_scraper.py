import requests
from bs4 import BeautifulSoup
import json
import time
import re
import urllib.parse
from typing import Dict, List, Optional

class NhacCuaTuiScraper:
    def __init__(self):
        self.base_url = "https://www.nhaccuatui.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def parse_songs_file(self, file_path: str) -> Dict[str, List[str]]:
        """Parse the songs.txt file and return a dictionary of artists and their songs"""
        songs_data = {}
        current_artist = None
        
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                    
                # Check if it's an artist line
                if line.startswith("CA SĨ"):
                    # Extract artist name (everything after the colon)
                    artist_name = line.split(":", 1)[1].strip()
                    current_artist = artist_name
                    songs_data[current_artist] = []
                elif current_artist and re.match(r'^\d+\s+', line):
                    # Extract song title (everything after the number)
                    song_title = re.sub(r'^\d+\s+', '', line).strip()
                    songs_data[current_artist].append(song_title)
        
        return songs_data
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison by removing diacritics, converting to lowercase, and removing extra spaces"""
        import unicodedata
        # Remove diacritics (accents)
        text = unicodedata.normalize('NFD', text)
        text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
        # Convert to lowercase and remove extra spaces
        text = re.sub(r'[^\w\s]', '', text.lower())
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts (0-1, where 1 is identical)"""
        text1_norm = self._normalize_text(text1)
        text2_norm = self._normalize_text(text2)
        
        if text1_norm == text2_norm:
            return 1.0
        
        # Check if one text contains the other
        if text1_norm in text2_norm or text2_norm in text1_norm:
            return 0.8
        
        # Simple word-based similarity
        words1 = set(text1_norm.split())
        words2 = set(text2_norm.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def search_song(self, song_title: str, artist: str) -> Optional[str]:
        """Search for a song on nhaccuatui.com and return the song URL"""
        try:
            search_query = f"{song_title} {artist}".strip()
            encoded_query = urllib.parse.quote(search_query)
            
            # Use the correct search URL format
            search_url = f"{self.base_url}/tim-kiem?q={encoded_query}"
            
            print(f"Searching for: {search_query}")
            print(f"Search URL: {search_url}")
            
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for the search results container
            search_frame = soup.find('div', {'class': 'sn_search_returns_frame'})
            if not search_frame:
                print("No search results frame found")
                return None
            
            # Find the song list within the search results
            song_list = search_frame.find('ul', {'class': 'sn_search_returns_list_song'})
            if not song_list:
                print("No song list found in search results")
                return None
            
            # Find individual song items
            song_items = song_list.find_all('li', {'class': 'sn_search_single_song'})
            print(f"Found {len(song_items)} song results")
            
            best_match = None
            best_score = 0.0
            best_url = None
            
            for song_item in song_items:
                # Look for the song title link within h3.title_song
                title_element = song_item.find('h3', {'class': 'title_song'})
                if title_element:
                    song_link = title_element.find('a')
                    if song_link:
                        href = song_link.get('href')
                        song_title_text = song_link.get('title', song_link.get_text().strip())
                        
                        # Get artist information
                        artist_element = song_item.find('h4', {'class': 'singer_song'})
                        artist_text = ""
                        if artist_element:
                            artist_link = artist_element.find('a', {'class': 'name_singer'})
                            if artist_link:
                                artist_text = artist_link.get('title', artist_link.get_text().strip())
                            else:
                                artist_text = artist_element.get_text().strip()
                        
                        # Verify this is a song page URL (not playlist)
                        if href and '/bai-hat/' in href:
                            # Calculate similarity scores
                            title_similarity = self._calculate_similarity(song_title, song_title_text)
                            artist_similarity = self._calculate_similarity(artist, artist_text)
                            
                            # Combined score (title is more important)
                            combined_score = (title_similarity * 0.7) + (artist_similarity * 0.3)
                            
                            print(f"Found song: '{song_title_text}' by '{artist_text}' (Title: {title_similarity:.2f}, Artist: {artist_similarity:.2f}, Combined: {combined_score:.2f})")
                            
                            # Check if this is our best match so far
                            if combined_score > best_score:
                                best_score = combined_score
                                best_match = (song_title_text, artist_text)
                                if href.startswith('/'):
                                    best_url = self.base_url + href
                                else:
                                    best_url = href
            
            # Return the best match if it's good enough (threshold of 0.5)
            if best_url and best_score >= 0.5:
                print(f"Selected best match: '{best_match[0]}' by '{best_match[1]}' (score: {best_score:.2f})")
                print(f"Selected song URL: {best_url}")
                return best_url
            
            print(f"No suitable song found in search results (best score: {best_score:.2f})")
            return None
            
        except Exception as e:
            print(f"Error searching for {song_title} by {artist}: {e}")
            return None
    
    def get_lyrics(self, song_url: str) -> Optional[str]:
        """Extract lyrics from a song page"""
        try:
            response = self.session.get(song_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements that might interfere
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Try different selectors for lyrics content (updated for nhaccuatui.com)
            lyrics_selectors = [
                'div.box-lyrics p',  # More specific selector
                '.pd_lyric',
                '.lyric-content', 
                '.lyrics-detail',
                '.song-lyric',
                '#divLyric',
                '.box-lyrics',
                'div[id*="lyric"]',
                'div[class*="lyric"]'
            ]
            
            lyrics_text = None
            used_selector = None
            
            for selector in lyrics_selectors:
                lyrics_elements = soup.select(selector)
                if lyrics_elements:
                    # Get text from all matching elements
                    combined_text = ""
                    for elem in lyrics_elements:
                        text = elem.get_text().strip()
                        if text and len(text) > 20:  # Only consider substantial text
                            combined_text += text + "\n"
                    
                    if combined_text.strip():
                        lyrics_text = combined_text.strip()
                        used_selector = selector
                        print(f"    Found lyrics using selector: {selector}")
                        break
            
            # Improved fallback strategy
            if not lyrics_text:
                print("    Trying fallback method...")
                # Look for divs that might contain lyrics
                potential_divs = soup.find_all(['div', 'p'], string=re.compile(r'[a-zA-ZÀ-ỹ\s]{50,}'))
                
                for div in potential_divs:
                    text = div.get_text().strip()
                    # Check if this looks like lyrics (long text, not navigation/ads)
                    if (len(text) > 100 and 
                        text.count('\n') > 3 and  # Has multiple lines
                        not any(nav_word in text.lower() for nav_word in ['menu', 'đăng nhập', 'quảng cáo', 'bình luận', 'chia sẻ'])):
                        lyrics_text = text
                        print("    Found lyrics using fallback method")
                        break
            
            if lyrics_text:
                # More aggressive cleaning
                lyrics_text = re.sub(r'\n\s*\n', '\n\n', lyrics_text)  # Fix multiple newlines
                lyrics_text = re.sub(r'^\s*Lời bài hát.*?:\s*', '', lyrics_text, flags=re.IGNORECASE)
                lyrics_text = re.sub(r'Ca sĩ:.*?\n', '', lyrics_text, flags=re.IGNORECASE)  # Remove artist info
                lyrics_text = re.sub(r'Sáng tác:.*?\n', '', lyrics_text, flags=re.IGNORECASE)  # Remove composer info
                lyrics_text = re.sub(r'Nhạc sĩ:.*?\n', '', lyrics_text, flags=re.IGNORECASE)  # Remove musician info
                
                # Remove common unwanted phrases
                unwanted_phrases = [
                    r'Xem toàn bộ.*',
                    r'Chia sẻ.*',
                    r'Bình luận.*',
                    r'Yêu thích.*',
                    r'Download.*',
                    r'Tải về.*'
                ]
                
                for phrase in unwanted_phrases:
                    lyrics_text = re.sub(phrase, '', lyrics_text, flags=re.IGNORECASE)
                
                # Final cleanup
                lyrics_text = re.sub(r'\n{3,}', '\n\n', lyrics_text)  # Max 2 consecutive newlines
                lyrics_text = lyrics_text.strip()
                
                # Validate that this looks like actual lyrics
                if len(lyrics_text) > 50 and lyrics_text.count('\n') > 0:
                    return lyrics_text
                else:
                    print(f"    Rejected extracted text (too short or no line breaks): {lyrics_text[:100]}...")
            
            print("    No lyrics found with any method")
            return None
            
        except Exception as e:
            print(f"Error extracting lyrics from {song_url}: {e}")
            return None
    
    def scrape_all_lyrics(self, songs_file: str, output_file: str = 'lyrics.json'):
        """Scrape lyrics for all songs and save to JSON"""
        songs_data = self.parse_songs_file(songs_file)
        results = {}
        
        total_songs = sum(len(songs) for songs in songs_data.values())
        current_count = 0
        
        print(f"Starting to scrape lyrics for {total_songs} songs...")
        
        for artist, songs in songs_data.items():
            print(f"\nProcessing artist: {artist}")
            results[artist] = {}
            
            for song in songs:
                current_count += 1
                print(f"[{current_count}/{total_songs}] Searching for: {song}")
                
                # Search for the song
                song_url = self.search_song(song, artist)
                
                if song_url:
                    print(f"  Found URL: {song_url}")
                    lyrics = self.get_lyrics(song_url)
                    
                    if lyrics:
                        results[artist][song] = {
                            'url': song_url,
                            'lyrics': lyrics,
                            'status': 'success'
                        }
                        print(f"  ✓ Lyrics extracted successfully")
                    else:
                        results[artist][song] = {
                            'url': song_url,
                            'lyrics': None,
                            'status': 'no_lyrics_found'
                        }
                        print(f"  ✗ No lyrics found on page")
                else:
                    results[artist][song] = {
                        'url': None,
                        'lyrics': None,
                        'status': 'not_found'
                    }
                    print(f"  ✗ Song not found")
                
                # Be respectful with requests
                time.sleep(1)
        
        # Save results to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\nScraping completed! Results saved to {output_file}")
        
        # Print summary
        successful = sum(1 for artist_songs in results.values() 
                        for song_data in artist_songs.values() 
                        if song_data['status'] == 'success')
        print(f"Successfully scraped lyrics for {successful}/{total_songs} songs")
        
        return results

def main():
    scraper = NhacCuaTuiScraper()
    
    # Check if songs.txt exists
    songs_file = 'songs.txt'
    try:
        results = scraper.scrape_all_lyrics(songs_file, 'vietnamese_lyrics.json')
        print("\nDone! Check 'vietnamese_lyrics.json' for the results.")
    except FileNotFoundError:
        print(f"Error: {songs_file} not found. Please make sure the file exists in the current directory.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
