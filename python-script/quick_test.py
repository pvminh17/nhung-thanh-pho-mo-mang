#!/usr/bin/env python3
"""Quick test script for the improved search functionality"""

try:
    from lyrics_scraper import NhacCuaTuiScraper
    print("Import successful")
except Exception as e:
    print(f"Import failed: {e}")
    exit(1)

def test_search():
    try:
        scraper = NhacCuaTuiScraper()
        print('Created scraper instance')
        
        print('Testing search for: Sau Cơn Mưa by RHYDER')
        url = scraper.search_song('Sau Cơn Mưa', 'RHYDER')
        
        if url:
            print(f'Found URL: {url}')
        else:
            print('No URL found')
    except Exception as e:
        print(f"Error during search: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_search()
