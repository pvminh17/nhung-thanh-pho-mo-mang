#!/usr/bin/env python3
"""
Generate PWA icons for the Vietnamese music app
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a music-themed icon"""
    
    # Create image with gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for i in range(size):
        alpha = int(255 * (1 - i / size))
        color = (33, 150, 243, alpha)  # Blue gradient
        draw.rectangle([0, i, size, i+1], fill=color)
    
    # Add circular background
    margin = size // 8
    circle_size = size - 2 * margin
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                fill=(33, 150, 243, 255), outline=(255, 255, 255, 100), width=2)
    
    # Add music note symbol
    center = size // 2
    note_size = size // 3
    
    # Draw musical note
    # Note stem
    stem_width = max(2, size // 40)
    stem_height = note_size
    stem_x = center + note_size // 4
    draw.rectangle([stem_x, center - stem_height//2, stem_x + stem_width, center + stem_height//2], 
                  fill=(255, 255, 255, 255))
    
    # Note head
    head_size = note_size // 3
    draw.ellipse([center - head_size, center + stem_height//4, center + head_size//2, center + stem_height//2], 
                fill=(255, 255, 255, 255))
    
    # Note flag
    flag_points = [
        (stem_x + stem_width, center - stem_height//2),
        (stem_x + stem_width + note_size//3, center - stem_height//3),
        (stem_x + stem_width + note_size//4, center - stem_height//4),
        (stem_x + stem_width, center - stem_height//4)
    ]
    draw.polygon(flag_points, fill=(255, 255, 255, 255))
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Created icon: {output_path}")

def generate_all_icons():
    """Generate all required PWA icons"""
    
    icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    icons_dir = "icons"
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in icon_sizes:
        output_path = os.path.join(icons_dir, f"icon-{size}x{size}.png")
        create_icon(size, output_path)
    
    print(f"\nGenerated {len(icon_sizes)} PWA icons successfully!")

if __name__ == "__main__":
    try:
        generate_all_icons()
    except ImportError:
        print("PIL (Pillow) is required to generate icons.")
        print("Install it with: pip install Pillow")
        print("\nAlternatively, you can use any icon generator online or create icons manually.")
        print("Required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512")
