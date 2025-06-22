#!/usr/bin/env python3
"""
Simple development server for the Vietnamese Music PWA
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Add PWA headers
        self.send_header('Service-Worker-Allowed', '/')
        
        super().end_headers()
    
    def do_GET(self):
        # Serve manifest.json with correct MIME type
        if self.path.endswith('.json'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            with open(self.path[1:], 'rb') as f:
                self.wfile.write(f.read())
            return
        
        super().do_GET()

def main():
    try:
        # Change to the directory containing the files
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
            print(f"🎵 Vietnamese Music PWA Development Server")
            print(f"📱 Server running at: http://localhost:{PORT}")
            print(f"📂 Serving files from: {os.getcwd()}")
            print(f"🚀 Opening browser...")
            print(f"   Press Ctrl+C to stop the server")
            print()
            
            # Open browser
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Start server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python dev-server.py --port 8001")
        else:
            print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Simple argument parsing for port
    if len(sys.argv) > 2 and sys.argv[1] == '--port':
        try:
            PORT = int(sys.argv[2])
        except ValueError:
            print("❌ Invalid port number")
            sys.exit(1)
    
    main()
