from PIL import Image, ImageDraw, ImageFont
import os

# Creiamo le icone manualmente con PIL - SOLO CALENDARIO SU SFONDO BIANCO
def create_app_icon(size):
    # Crea immagine con sfondo bianco pulito
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Proporzioni in base alla dimensione
    scale = size / 512
    
    # Calendario body (bianco con bordo)
    cal_x = int(100 * scale)
    cal_y = int(120 * scale)
    cal_w = int(312 * scale)
    cal_h = int(340 * scale)
    draw.rounded_rectangle(
        [(cal_x, cal_y), (cal_x + cal_w, cal_y + cal_h)],
        radius=int(24 * scale),
        fill=(255, 255, 255, 255),
        outline=(74, 144, 226, 255),
        width=max(2, int(8 * scale))
    )
    
    # Calendario header (blu gradiente simulato)
    header_h = int(90 * scale)
    draw.rounded_rectangle(
        [(cal_x, cal_y), (cal_x + cal_w, cal_y + header_h)],
        radius=int(24 * scale),
        fill=(74, 144, 226, 255)
    )
    draw.rectangle(
        [(cal_x, cal_y + int(50 * scale)), (cal_x + cal_w, cal_y + header_h)],
        fill=(74, 144, 226, 255)
    )
    
    # Anelli del calendario (più grandi e evidenti)
    ring_y = cal_y - int(5 * scale)
    ring_r = int(16 * scale)
    for ring_x in [int(160 * scale), int(256 * scale), int(352 * scale)]:
        draw.ellipse(
            [(ring_x - ring_r, ring_y - ring_r), (ring_x + ring_r, ring_y + ring_r)],
            fill=(51, 51, 51, 255)
        )
    
    # Griglia del calendario (giorni della settimana)
    dot_r = int(10 * scale)
    positions = [
        (140, 240), (180, 240), (220, 240), (260, 240), (300, 240), (340, 240), (380, 240),
        (140, 285), (180, 285), (220, 285), (260, 285), (300, 285), (340, 285), (380, 285),
        (140, 330), (180, 330), (220, 330), (260, 330), (300, 330), (340, 330), (380, 330),
        (140, 375), (180, 375), (220, 375), (260, 375), (300, 375), (340, 375), (380, 375),
        (140, 420), (180, 420), (220, 420), (260, 420), (300, 420)
    ]
    for x, y in positions:
        sx = int(x * scale)
        sy = int(y * scale)
        draw.ellipse(
            [(sx - dot_r, sy - dot_r), (sx + dot_r, sy + dot_r)],
            fill=(74, 144, 226, 255)
        )
    
    # Evidenzia data importante (rosa/rosso)
    sx = int(260 * scale)
    sy = int(330 * scale)
    highlight_r = int(14 * scale)
    draw.ellipse(
        [(sx - highlight_r, sy - highlight_r), (sx + highlight_r, sy + highlight_r)],
        fill=(255, 87, 87, 255)
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

for folder, size in sizes.items():
    folder_path = os.path.join(base_path, folder)
    
    # Crea ic_launcher.png
    icon = create_app_icon(size)
    icon.save(os.path.join(folder_path, 'ic_launcher.png'))
    
    # Crea ic_launcher_round.png (stessa icona)
    icon.save(os.path.join(folder_path, 'ic_launcher_round.png'))
    
    # Crea ic_launcher_foreground.png (versione con trasparenza)
    icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'))
    
    print(f"Creato icone per {folder} ({size}x{size})")

print("\n✓ Icone create con successo!")
