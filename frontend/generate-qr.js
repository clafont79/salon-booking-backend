const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// URL dove verrà hostato l'APK (da aggiornare dopo il caricamento su GitHub Releases)
const ANDROID_APK_URL = 'https://github.com/clafont79/salon-booking-backend/releases/download/v1.0.0/hairIT.apk';
const IOS_TESTFLIGHT_URL = 'https://testflight.apple.com/join/YOUR_CODE'; // Da configurare con TestFlight

// Directory di output
const outputDir = path.join(__dirname, 'qr-codes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Genera QR Code per Android
QRCode.toFile(
  path.join(outputDir, 'qr-android.png'),
  ANDROID_APK_URL,
  {
    width: 400,
    margin: 2,
    color: {
      dark: '#667eea',  // Colore del QR code (tema dell'app)
      light: '#ffffff'
    }
  },
  (err) => {
    if (err) {
      console.error('❌ Errore generazione QR Android:', err);
    } else {
      console.log('✅ QR Code Android generato: qr-codes/qr-android.png');
      console.log('📱 URL Android:', ANDROID_APK_URL);
    }
  }
);

// Genera QR Code per iOS (TestFlight)
QRCode.toFile(
  path.join(outputDir, 'qr-ios.png'),
  IOS_TESTFLIGHT_URL,
  {
    width: 400,
    margin: 2,
    color: {
      dark: '#667eea',
      light: '#ffffff'
    }
  },
  (err) => {
    if (err) {
      console.error('❌ Errore generazione QR iOS:', err);
    } else {
      console.log('✅ QR Code iOS generato: qr-codes/qr-ios.png');
      console.log('🍎 URL iOS:', IOS_TESTFLIGHT_URL);
    }
  }
);

// Genera anche una pagina HTML con entrambi i QR code
const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scarica hairIT</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 900px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            text-align: center;
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.1em;
        }
        .qr-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .qr-card {
            text-align: center;
            padding: 20px;
            border-radius: 15px;
            background: #f8f9fa;
            transition: transform 0.3s;
        }
        .qr-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .platform-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        .qr-card h2 {
            color: #333;
            margin-bottom: 20px;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            margin: 20px 0;
        }
        .qr-code img {
            display: block;
            max-width: 100%;
            height: auto;
        }
        .download-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .download-btn:hover {
            transform: scale(1.05);
        }
        .info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            border-left: 4px solid #2196f3;
        }
        .info h3 {
            color: #1976d2;
            margin-bottom: 10px;
        }
        .info p {
            color: #555;
            line-height: 1.6;
        }
        .warning {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        .warning h3 {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 hairIT</h1>
        <p class="subtitle">Il tuo appuntamento a portata di voce</p>
        
        <div class="qr-section">
            <div class="qr-card">
                <div class="platform-icon">🤖</div>
                <h2>Android</h2>
                <div class="qr-code">
                    <img src="qr-android.png" alt="QR Code Android">
                </div>
                <p>Scansiona il QR code o clicca il pulsante per scaricare l'APK</p>
                <br>
                <a href="${ANDROID_APK_URL}" class="download-btn">📥 Scarica APK</a>
            </div>
            
            <div class="qr-card">
                <div class="platform-icon">🍎</div>
                <h2>iOS</h2>
                <div class="qr-code">
                    <img src="qr-ios.png" alt="QR Code iOS">
                </div>
                <p>Scansiona il QR code per accedere a TestFlight</p>
                <br>
                <a href="${IOS_TESTFLIGHT_URL}" class="download-btn">🚀 Apri TestFlight</a>
            </div>
        </div>
        
        <div class="info">
            <h3>📋 Istruzioni per Android:</h3>
            <p>
                1. Scansiona il QR code con la fotocamera<br>
                2. Scarica il file APK<br>
                3. Abilita "Installa app sconosciute" nelle impostazioni<br>
                4. Installa l'app<br>
                5. Apri hairIT e inizia a prenotare!
            </p>
        </div>
        
        <div class="info warning">
            <h3>⚠️ Nota per iOS:</h3>
            <p>
                Per iOS è necessario essere invitati su TestFlight.<br>
                Contatta l'amministratore per ricevere l'invito.
            </p>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent);
console.log('✅ Pagina HTML generata: qr-codes/index.html');
console.log('\n📝 Prossimi passi:');
console.log('1. Build dell\'APK: cd android && ./gradlew assembleRelease');
console.log('2. Carica l\'APK su GitHub Releases');
console.log('3. Aggiorna l\'URL in questo script');
console.log('4. Rigenera i QR code: node generate-qr.js');
console.log('5. Condividi la pagina HTML o i QR code');
