from PIL import Image
import os

def create_app_icon(source_img, size):
    """Ridimensiona l'icona hairIT per le varie dimensioni Android"""
    # Ridimensiona l'immagine mantenendo la qualità
    resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
    return resized

# Dimensioni per Android
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# Carica l'icona originale da src/assets
source_icon_path = r'src\assets\iconApp.png'

if not os.path.exists(source_icon_path):
    print(f"❌ Errore: File {source_icon_path} non trovato!")
    print("Assicurati che il file iconApp.png esista in src/assets/")
    exit(1)

print("🎨 Caricamento icona hairIT da src/assets/iconApp.png...")
source_icon = Image.open(source_icon_path).convert('RGBA')

base_path = r'android\app\src\main\res'

print("🎨 Generazione icone hairIT per Android...")

for folder, size in sizes.items():
    folder_path = os.path.join(base_path, folder)
    
    # Crea ic_launcher.png
    icon = create_app_icon(source_icon, size)
    icon.save(os.path.join(folder_path, 'ic_launcher.png'))
    print(f"  ✓ {folder}/ic_launcher.png ({size}x{size})")
    
    # Crea ic_launcher_round.png (stessa icona)
    icon.save(os.path.join(folder_path, 'ic_launcher_round.png'))
    print(f"  ✓ {folder}/ic_launcher_round.png ({size}x{size})")
    
    # Crea ic_launcher_foreground.png (versione con trasparenza per adaptive icon)
    icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'))
    print(f"  ✓ {folder}/ic_launcher_foreground.png ({size}x{size})")

print("\n✨ Icone hairIT create con successo!")
print("📱 Le icone sono ora coerenti con quelle mostrate nella home dell'app")
print("\n🔧 Prossimi passi:")
print("  1. Ricompila l'app Android: ionic build")
print("  2. Rigenera l'APK: ionic capacitor build android")
print("  3. Riavvia l'app sullo smartphone per vedere le nuove icone")
