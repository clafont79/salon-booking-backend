from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon(size):
    """Crea icona hairIT con forbici su sfondo gradiente viola"""
    # Crea immagine con gradiente viola (hairIT brand colors: #667eea -> #764ba2)
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Disegna gradiente verticale
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Proporzioni in base alla dimensione
    scale = size / 512
    center_x = size // 2
    center_y = size // 2
    
    # Disegna forbici stilizzate (simbolo ✂)
    # Lama sinistra inclinata
    left_blade_w = int(50 * scale)
    left_blade_h = int(120 * scale)
    left_x = center_x - int(40 * scale)
    left_y = center_y - int(20 * scale)
    
    # Crea lama sinistra e ruotala
    left_blade = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    left_draw = ImageDraw.Draw(left_blade)
    left_draw.ellipse(
        [(left_x - left_blade_w//2, left_y - left_blade_h//2),
         (left_x + left_blade_w//2, left_y + left_blade_h//2)],
        fill=(255, 255, 255, 255)
    )
    left_blade = left_blade.rotate(-25, center=(center_x, center_y), resample=Image.BICUBIC)
    img = Image.alpha_composite(img, left_blade)
    
    # Lama destra inclinata
    right_blade_w = int(50 * scale)
    right_blade_h = int(120 * scale)
    right_x = center_x + int(40 * scale)
    right_y = center_y - int(20 * scale)
    
    right_blade = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    right_draw = ImageDraw.Draw(right_blade)
    right_draw.ellipse(
        [(right_x - right_blade_w//2, right_y - right_blade_h//2),
         (right_x + right_blade_w//2, right_y + right_blade_h//2)],
        fill=(255, 255, 255, 255)
    )
    right_blade = right_blade.rotate(25, center=(center_x, center_y), resample=Image.BICUBIC)
    img = Image.alpha_composite(img, right_blade)
    
    # Manici circolari (anelli delle forbici)
    handle_r = int(35 * scale)
    handle_thickness = max(2, int(8 * scale))
    
    # Manico sinistro
    left_handle_x = center_x - int(65 * scale)
    left_handle_y = center_y + int(80 * scale)
    draw.ellipse(
        [(left_handle_x - handle_r, left_handle_y - handle_r),
         (left_handle_x + handle_r, left_handle_y + handle_r)],
        fill=None,
        outline=(255, 255, 255, 255),
        width=handle_thickness
    )
    
    # Manico destro
    right_handle_x = center_x + int(65 * scale)
    right_handle_y = center_y + int(80 * scale)
    draw.ellipse(
        [(right_handle_x - handle_r, right_handle_y - handle_r),
         (right_handle_x + handle_r, right_handle_y + handle_r)],
        fill=None,
        outline=(255, 255, 255, 255),
        width=handle_thickness
    )
    
    # Perno centrale (dove si incrociano le lame)
    pivot_r = int(20 * scale)
    draw.ellipse(
        [(center_x - pivot_r, center_y - pivot_r),
         (center_x + pivot_r, center_y + pivot_r)],
        fill=(255, 255, 255, 255)
    )
    
    return img

# Dimensioni per Android
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

base_path = r'android\app\src\main\res'

print("🎨 Generazione icone hairIT...")

for folder, size in sizes.items():
    folder_path = os.path.join(base_path, folder)
    
    # Crea ic_launcher.png
    icon = create_app_icon(size)
    icon.save(os.path.join(folder_path, 'ic_launcher.png'))
    print(f"  ✓ {folder}/ic_launcher.png ({size}x{size})")
    
    # Crea ic_launcher_round.png (stessa icona)
    icon.save(os.path.join(folder_path, 'ic_launcher_round.png'))
    print(f"  ✓ {folder}/ic_launcher_round.png ({size}x{size})")
    
    # Crea ic_launcher_foreground.png (versione con trasparenza per adaptive icon)
    icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'))
    print(f"  ✓ {folder}/ic_launcher_foreground.png ({size}x{size})")

print("\n✨ Icone hairIT create con successo!")
print("📱 Le icone con forbici e gradiente viola sono pronte per l'APK")
