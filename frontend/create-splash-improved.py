#!/usr/bin/env python3
"""
Script per creare una splash screen migliorata con icone in dissolvenza
per l'app salon booking
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

def create_gradient_background(width, height):
    """Crea un background con gradiente viola"""
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)
    
    # Colori del gradiente (dal theme dell'app)
    color1 = (102, 126, 234)  # #667eea primary
    color2 = (118, 75, 162)   # #764ba2 secondary
    
    for y in range(height):
        # Calcola il colore interpolato
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return image

def draw_icon_scissors(draw, x, y, size, opacity):
    """Disegna un'icona stilizzata di forbici"""
    color = (255, 255, 255, opacity)
    
    # Disegna le due lame delle forbici
    # Lama superiore
    draw.ellipse([x, y, x + size//3, y + size//3], outline=color, width=3)
    # Lama inferiore
    draw.ellipse([x, y + size*2//3, x + size//3, y + size], outline=color, width=3)
    # Manico
    draw.line([x + size//6, y + size//6, x + size, y + size//2], fill=color, width=3)

def draw_icon_calendar(draw, x, y, size, opacity):
    """Disegna un'icona stilizzata di calendario"""
    color = (255, 255, 255, opacity)
    
    # Quadrato del calendario
    draw.rectangle([x, y + size//5, x + size, y + size], outline=color, width=3)
    # Header del calendario
    draw.rectangle([x, y + size//5, x + size, y + size*2//5], fill=color)
    # Righe e colonne
    for i in range(1, 4):
        draw.line([x, y + size//5 + i * size//5, x + size, y + size//5 + i * size//5], fill=color, width=1)
        draw.line([x + i * size//4, y + size*2//5, x + i * size//4, y + size], fill=color, width=1)

def draw_icon_clock(draw, x, y, size, opacity):
    """Disegna un'icona stilizzata di orologio"""
    color = (255, 255, 255, opacity)
    
    # Cerchio esterno
    center_x = x + size // 2
    center_y = y + size // 2
    draw.ellipse([x, y, x + size, y + size], outline=color, width=3)
    
    # Lancette
    draw.line([center_x, center_y, center_x, center_y - size//3], fill=color, width=3)  # Ore
    draw.line([center_x, center_y, center_x + size//4, center_y], fill=color, width=2)  # Minuti

def draw_icon_comb(draw, x, y, size, opacity):
    """Disegna un'icona stilizzata di pettine"""
    color = (255, 255, 255, opacity)
    
    # Base del pettine
    draw.rectangle([x, y, x + size, y + size//4], outline=color, fill=color)
    
    # Denti del pettine
    teeth_count = 8
    tooth_width = size // teeth_count
    for i in range(teeth_count):
        tooth_x = x + i * tooth_width
        draw.rectangle([tooth_x, y + size//4, tooth_x + tooth_width - 2, y + size], fill=color)

def draw_icon_star(draw, x, y, size, opacity):
    """Disegna un'icona stilizzata di stella"""
    color = (255, 255, 255, opacity)
    
    center_x = x + size // 2
    center_y = y + size // 2
    
    # Punti della stella (5 punte)
    points = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        radius = size // 2 if i % 2 == 0 else size // 4
        px = center_x + int(radius * math.cos(angle))
        py = center_y + int(radius * math.sin(angle))
        points.append((px, py))
    
    draw.polygon(points, outline=color, fill=color)

def create_splash_screen(width, height):
    """Crea la splash screen completa"""
    # Crea background con gradiente
    image = create_gradient_background(width, height)
    
    # Converti in RGBA per supportare la trasparenza
    image = image.convert('RGBA')
    
    # Crea un layer trasparente per le icone
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Parametri per le icone
    icon_size = min(width, height) // 8
    center_x = width // 2
    center_y = height // 2
    
    # Posiziona le icone in cerchio attorno al centro con opacità decrescente
    icons = [
        (draw_icon_scissors, 0, 200),
        (draw_icon_calendar, math.pi / 3, 180),
        (draw_icon_clock, 2 * math.pi / 3, 160),
        (draw_icon_comb, math.pi, 140),
        (draw_icon_star, 4 * math.pi / 3, 120),
    ]
    
    radius = min(width, height) // 3
    
    for icon_func, angle, opacity in icons:
        x = center_x + int(radius * math.cos(angle)) - icon_size // 2
        y = center_y + int(radius * math.sin(angle)) - icon_size // 2
        icon_func(draw, x, y, icon_size, opacity)
    
    # Logo centrale (cerchio con testo)
    logo_size = icon_size * 2
    logo_x = center_x - logo_size // 2
    logo_y = center_y - logo_size // 2
    
    # Cerchio bianco centrale
    draw.ellipse([logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], 
                 fill=(255, 255, 255, 255), outline=(255, 255, 255, 255))
    
    # Combina i layer
    image = Image.alpha_composite(image, overlay)
    
    # Aggiungi testo (usa font di sistema se disponibile)
    draw = ImageDraw.Draw(image)
    try:
        font_title = ImageFont.truetype("arial.ttf", width // 15)
        font_subtitle = ImageFont.truetype("arial.ttf", width // 30)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
    
    # Testo sotto il logo
    title_text = "Salon Booking"
    subtitle_text = "Il tuo salone a portata di tap"
    
    # Calcola posizione testo centrato
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    
    subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=font_subtitle)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    
    # Disegna il testo
    draw.text((center_x - title_width // 2, center_y + logo_size + 40), 
              title_text, fill=(255, 255, 255, 255), font=font_title)
    draw.text((center_x - subtitle_width // 2, center_y + logo_size + 80), 
              subtitle_text, fill=(255, 255, 255, 200), font=font_subtitle)
    
    return image

def main():
    """Genera le splash screen per diverse risoluzioni"""
    resolutions = {
        'drawable': (480, 800),
        'drawable-mdpi': (320, 480),
        'drawable-hdpi': (480, 800),
        'drawable-xhdpi': (720, 1280),
        'drawable-xxhdpi': (1080, 1920),
        'drawable-xxxhdpi': (1440, 2560),
        # Portrait
        'drawable-port-mdpi': (320, 480),
        'drawable-port-hdpi': (480, 800),
        'drawable-port-xhdpi': (720, 1280),
        'drawable-port-xxhdpi': (1080, 1920),
        'drawable-port-xxxhdpi': (1440, 2560),
        # Landscape
        'drawable-land-mdpi': (480, 320),
        'drawable-land-hdpi': (800, 480),
        'drawable-land-xhdpi': (1280, 720),
        'drawable-land-xxhdpi': (1920, 1080),
        'drawable-land-xxxhdpi': (2560, 1440),
    }
    
    print("🎨 Creazione splash screens migliorata...")
    
    for folder, (width, height) in resolutions.items():
        print(f"  📱 Generando {folder} ({width}x{height})...")
        
        # Crea l'immagine
        image = create_splash_screen(width, height)
        
        # Converti in RGB per salvare come PNG
        image = image.convert('RGB')
        
        # Crea la directory se non esiste
        output_path = f'android/app/src/main/res/{folder}/splash.png'
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Salva
        image.save(output_path, 'PNG', quality=95)
    
    print("✅ Splash screens create con successo!")
    print("ℹ️  Rebuild dell'app Android richiesto per vedere le modifiche")

if __name__ == '__main__':
    main()
