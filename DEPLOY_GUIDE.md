# 📦 Guida Deploy hairIT su GitHub Releases

## 🎯 Panoramica
Questa guida ti aiuterà a pubblicare l'app hairIT su GitHub Releases e distribuirla tramite QR code.

## 📋 Prerequisiti
- ✅ APK compilato (in `frontend/releases/hairIT-v1.0.0.apk`)
- ✅ Account GitHub con accesso al repository
- ✅ Repository: https://github.com/clafont79/salon-booking-backend

## 🚀 Passi per il Deploy

### 1. Creare una Release su GitHub

1. Vai su https://github.com/clafont79/salon-booking-backend/releases
2. Clicca su **"Create a new release"** (in alto a destra)
3. Compila i campi:
   - **Tag version**: `v1.0.0` (o la versione corrente)
   - **Release title**: `hairIT v1.0.0 - Prima Release`
   - **Description**: Copia il testo sotto

```markdown
# 📱 hairIT v1.0.0

Benvenuto alla prima release ufficiale di **hairIT** - Il tuo appuntamento a portata di voce!

## ✨ Caratteristiche Principali
- 🎤 Prenotazione vocale intelligente
- 📅 Gestione appuntamenti in tempo reale
- 👤 Profilo utente personalizzabile
- 🔔 Notifiche push
- 🌍 Geolocalizzazione integrata
- 🔐 Autenticazione con Google
- 📊 Dashboard amministratore

## 📥 Download
Scarica l'APK e installalo sul tuo dispositivo Android.

### Istruzioni per l'installazione:
1. Scarica il file `hairIT-v1.0.0.apk`
2. Abilita "Installa app sconosciute" nelle impostazioni del tuo dispositivo
3. Apri il file APK e segui le istruzioni
4. Apri hairIT e inizia a prenotare!

### 📱 Scansiona il QR Code
Puoi anche scansionare il QR code dalla pagina di download: [Download Page](https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/index.html)

## 🔐 Credenziali di Test
- **Admin**: admin@salon.com / adminSalon2025
- **Cliente**: cliente@test.com / cliente123

## 🐛 Segnalazione Bug
Hai trovato un bug? Apri una [Issue](https://github.com/clafont79/salon-booking-backend/issues)

## 📝 Changelog
- ✨ Prima release pubblica
- 🎨 Rebranding da "Salon Booking" a "hairIT"
- 🔐 Aggiunta autenticazione Google
- 🌍 Integrata geolocalizzazione
- 📱 Nuova icona e splash screen
```

### 2. Caricare i File

Nella sezione **"Attach binaries by dropping them here or selecting them"**:

Carica questi file dalla cartella `frontend/`:
- `releases/hairIT-v1.0.0.apk` → Rinominalo in `hairIT.apk`
- `qr-codes/index.html` → Pagina con i QR code
- `qr-codes/qr-android.png` → QR code Android
- `qr-codes/qr-ios.png` → QR code iOS (opzionale)

### 3. Pubblicare la Release

1. Seleziona **"Set as the latest release"**
2. Clicca su **"Publish release"**

### 4. Ottenere gli URL

Dopo la pubblicazione, avrai questi URL:

- **APK Direct Download**: 
  ```
  https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/hairIT.apk
  ```

- **Pagina Release**: 
  ```
  https://github.com/clafont79/salon-booking-backend/releases/tag/v1.0.0
  ```

- **Pagina QR Code**: 
  ```
  https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/index.html
  ```

### 5. Aggiornare il QR Code

1. Apri `frontend/generate-qr.js`
2. Aggiorna la costante `ANDROID_APK_URL` con l'URL reale:
   ```javascript
   const ANDROID_APK_URL = 'https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/hairIT.apk';
   ```
3. Rigenera i QR code:
   ```bash
   cd frontend
   node generate-qr.js
   ```
4. Ricarica i file aggiornati su GitHub Releases

## 📱 Condivisione

### Opzione 1: Link Diretto
Condividi questo link per il download diretto:
```
https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/hairIT.apk
```

### Opzione 2: Pagina QR Code
Condividi la pagina con i QR code:
```
https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/index.html
```

### Opzione 3: Immagine QR
Condividi direttamente il PNG del QR code:
- Su WhatsApp/Telegram
- Stampa per locandine
- Inserisci nel sito web

## 🔄 Aggiornamenti Futuri

Per le prossime versioni:
1. Incrementa la versione in `package.json`
2. Aggiorna la versione in `android/app/build.gradle`
3. Ripeti il processo di build
4. Crea una nuova release con il nuovo tag (es. `v1.1.0`)

## 🎨 Personalizzazione QR Code

Il QR code usa i colori del brand hairIT:
- Primary: #667eea
- Secondary: #764ba2

Puoi personalizzarli in `generate-qr.js` nella sezione `color`.

## ⚠️ Note Importanti

### Sicurezza
- L'APK non è firmato da Google Play Store
- Gli utenti dovranno abilitare "Installa app sconosciute"
- Considera di pubblicare su Google Play Store per distribuzione ufficiale

### Dimensioni
- L'APK è circa 40-60 MB
- Consiglia il download via WiFi

### Compatibilità
- Android 5.0 (API 21) o superiore
- Testato su Android 10, 11, 12, 13

## 📞 Supporto

Per assistenza:
- Email: support@hairit.app
- GitHub Issues: https://github.com/clafont79/salon-booking-backend/issues
- Repository: https://github.com/clafont79/salon-booking-backend

---

**🎉 Congratulazioni! La tua app è ora distribuibile!**
