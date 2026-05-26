#!/usr/bin/env python3
"""Generate professional category-specific cover images for live streams."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

OUTPUT_DIR = "/home/z/my-project/public/images/live-covers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Category configurations: (gradient_start, gradient_end, icon_char, accent_color)
CATEGORIES = {
    "music": {
        "gradient": ((60, 20, 120), (20, 10, 60)),
        "icon": "♪",
        "accent": (167, 139, 250),
        "label": "MUSIC",
    },
    "gaming": {
        "gradient": ((30, 40, 120), (10, 20, 60)),
        "icon": "⎔",
        "accent": (96, 165, 250),
        "label": "GAMING",
    },
    "dance": {
        "gradient": ((120, 20, 80), (50, 10, 40)),
        "icon": "✦",
        "accent": (244, 114, 182),
        "label": "DANCE",
    },
    "comedy": {
        "gradient": ((120, 60, 10), (50, 25, 5)),
        "icon": "☺",
        "accent": (251, 191, 36),
        "label": "COMEDY",
    },
    "sports": {
        "gradient": ((20, 80, 40), (10, 40, 20)),
        "icon": "⚽",
        "accent": (52, 211, 153),
        "label": "SPORTS",
    },
    "art": {
        "gradient": ((20, 80, 100), (10, 40, 50)),
        "icon": "◎",
        "accent": (34, 211, 238),
        "label": "ART",
    },
    "lifestyle": {
        "gradient": ((100, 30, 50), (50, 15, 25)),
        "icon": "✧",
        "accent": (251, 113, 133),
        "label": "LIFESTYLE",
    },
    "trending": {
        "gradient": ((100, 20, 80), (50, 10, 40)),
        "icon": "★",
        "accent": (232, 121, 249),
        "label": "TRENDING",
    },
    "cooking": {
        "gradient": ((120, 60, 15), (60, 30, 8)),
        "icon": "♨",
        "accent": (251, 146, 60),
        "label": "COOKING",
    },
    "fitness": {
        "gradient": ((40, 90, 20), (20, 45, 10)),
        "icon": "▲",
        "accent": (132, 204, 22),
        "label": "FITNESS",
    },
    "tech": {
        "gradient": ((30, 40, 100), (15, 20, 50)),
        "icon": "⌘",
        "accent": (129, 140, 248),
        "label": "TECH",
    },
    "fashion": {
        "gradient": ((100, 20, 80), (50, 10, 40)),
        "icon": "◇",
        "accent": (232, 121, 249),
        "label": "FASHION",
    },
    "education": {
        "gradient": ((20, 50, 100), (10, 25, 50)),
        "icon": "✎",
        "accent": (125, 211, 252),
        "label": "EDUCATION",
    },
    "talk": {
        "gradient": ((50, 50, 60), (25, 25, 30)),
        "icon": "♦",
        "accent": (148, 163, 184),
        "label": "TALK",
    },
    "food": {
        "gradient": ((120, 60, 15), (60, 30, 8)),
        "icon": "♨",
        "accent": (251, 146, 60),
        "label": "FOOD",
    },
    "live": {
        "gradient": ((120, 20, 30), (60, 10, 15)),
        "icon": "●",
        "accent": (239, 68, 68),
        "label": "LIVE",
    },
}


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def create_gradient(width, height, start_color, end_color, direction="diagonal"):
    """Create a gradient image."""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    for y in range(height):
        for x in range(width):
            if direction == "diagonal":
                # Diagonal gradient
                ratio = (x / width * 0.5 + y / height * 0.5)
            elif direction == "radial":
                # Radial gradient from center
                cx, cy = width * 0.4, height * 0.4
                dist = math.sqrt((x - cx)**2 + (y - cy)**2)
                max_dist = math.sqrt(cx**2 + cy**2)
                ratio = min(1.0, dist / max_dist)
            else:
                ratio = y / height
            
            r = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
            g = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
            b = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)
            draw.point((x, y), fill=(r, g, b))
    
    return img


def add_glow(draw, cx, cy, radius, color, alpha_max=60):
    """Add a soft glow effect at the given position."""
    for r in range(radius, 0, -1):
        alpha = int(alpha_max * (1 - r / radius) ** 2)
        fill = (*color, alpha)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=fill
        )


def add_particles(draw, width, height, color, count=30):
    """Add subtle floating particle dots."""
    import random
    random.seed(42)  # Consistent look
    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(1, 4)
        alpha = random.randint(20, 80)
        fill = (*color, alpha)
        draw.ellipse([x - size, y - size, x + size, y + size], fill=fill)


def create_cover(category, config, width=1344, height=768):
    """Create a professional cover image for a live stream category."""
    # Base gradient
    img = create_gradient(width, height, config["gradient"][0], config["gradient"][1], "diagonal")
    
    # Convert to RGBA for overlay effects
    img = img.convert('RGBA')
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    accent = config["accent"]
    
    # Add radial glow in center area
    add_glow(overlay_draw, width // 2, height // 2, 350, accent, alpha_max=40)
    
    # Add secondary glow top-right
    add_glow(overlay_draw, width * 3 // 4, height // 4, 200, accent, alpha_max=25)
    
    # Add particles
    add_particles(overlay_draw, width, height, accent, count=40)
    
    # Composite overlay
    img = Image.alpha_composite(img, overlay)
    
    # Draw on the final image
    draw = ImageDraw.Draw(img)
    
    # Try to find a good font
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/english/Tinos-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    
    font_large = None
    font_label = None
    font_sub = None
    
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_large = ImageFont.truetype(fp, 180)
                font_label = ImageFont.truetype(fp, 48)
                font_sub = ImageFont.truetype(fp, 28)
                break
            except:
                pass
    
    if not font_large:
        font_large = ImageFont.load_default()
        font_label = font_large
        font_sub = font_large
    
    # Draw the large icon character
    icon = config["icon"]
    bbox = draw.textbbox((0, 0), icon, font=font_large)
    icon_w = bbox[2] - bbox[0]
    icon_h = bbox[3] - bbox[1]
    icon_x = (width - icon_w) // 2 - bbox[0]
    icon_y = (height - icon_h) // 2 - bbox[1] - 30
    
    # Draw icon with glow effect
    draw.text((icon_x, icon_y), icon, fill=(*accent, 180), font=font_large)
    
    # Draw category label
    label = config["label"]
    bbox = draw.textbbox((0, 0), label, font=font_label)
    label_w = bbox[2] - bbox[0]
    label_x = (width - label_w) // 2 - bbox[0]
    label_y = icon_y + icon_h + 20
    
    draw.text((label_x, label_y), label, fill=(255, 255, 255, 220), font=font_label)
    
    # Draw "LIVE STREAM" subtitle
    sub = "LIVE STREAM"
    bbox = draw.textbbox((0, 0), sub, font=font_sub)
    sub_w = bbox[2] - bbox[0]
    sub_x = (width - sub_w) // 2 - bbox[0]
    sub_y = label_y + 60
    
    draw.text((sub_x, sub_y), sub, fill=(255, 255, 255, 100), font=font_sub)
    
    # Add subtle vignette
    vignette = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    vig_draw = ImageDraw.Draw(vignette)
    for i in range(80):
        alpha = int(120 * (1 - i / 80) ** 2)
        vig_draw.rectangle([i, i, width - i, height - i], outline=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, vignette)
    
    # Add LIVE badge in top-left
    badge_draw = ImageDraw.Draw(img)
    badge_w, badge_h = 120, 36
    badge_x, badge_y = 30, 30
    badge_draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=18,
        fill=(220, 38, 38, 230)
    )
    # "LIVE" text
    try:
        badge_font = ImageFont.truetype(font_paths[0] if os.path.exists(font_paths[0]) else None, 18)
    except:
        badge_font = ImageFont.load_default()
    
    live_text = "LIVE"
    bbox = badge_draw.textbbox((0, 0), live_text, font=badge_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = badge_x + (badge_w - tw) // 2 - bbox[0]
    ty = badge_y + (badge_h - th) // 2 - bbox[1]
    badge_draw.text((tx, ty), live_text, fill=(255, 255, 255, 255), font=badge_font)
    
    # Convert back to RGB for JPEG saving
    img = img.convert('RGB')
    
    return img


# Generate all covers
for category, config in CATEGORIES.items():
    print(f"Generating cover for {category}...")
    img = create_cover(category, config)
    output_path = os.path.join(OUTPUT_DIR, f"{category}.jpg")
    img.save(output_path, "JPEG", quality=90)
    print(f"  Saved to {output_path}")

print(f"\nAll {len(CATEGORIES)} covers generated!")
