Voice input for booking page

What I added
- A microphone button next to the `Servizio` field on `src/app/pages/booking/booking.page.html`.
- Speech recognition logic in `src/app/pages/booking/booking.page.ts` using the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
- Basic parsing of the transcript to autofill:
  - relative dates: "oggi", "domani", "dopodomani"
  - explicit dates like "12 settembre 2025" or "12 settembre"
  - times like "alle 15:30", "ore 15" or "15:30"
  - operator matching by name (if operator name exists in the transcript)
  - remaining text is used to populate the `servizio` field
- A short transcript preview under the form showing what was recognized.

How to test (browser)
1. Run the frontend dev server:

```powershell
cd frontend
ionic serve --host=0.0.0.0
```

2. Open the app in Chrome (desktop) at `http://localhost:8100` or in Chrome on Android.
3. Go to "Prenota Appuntamento", click the microphone icon and speak a sentence like:
   - "Vorrei prenotare con Marco il 12 settembre alle 15:30 per un taglio"
   - "Prenota domani alle 10 per colore"
4. The form should autofill date, time, operator (if matched), and service.

Notes and limitations
- Web Speech API support: Chrome (desktop & Android) supports SpeechRecognition. Firefox does not support it. Safari support is limited.
- For the native Android app (Capacitor): speech recognition will work if the WebView provides the API (Chrome-based WebView usually does). If it does not, you'll need a native plugin (e.g., `cordova-plugin-speechrecognition` or a Capacitor community plugin) to get consistent behavior across devices.
- The parsing is heuristic and basic; for more robust parsing (natural language dates/times) consider integrating a library (e.g., chrono-node) or a backend NLP service.

Native Android/iOS support (recommended)
--------------------------------------
To enable reliable speech recognition inside the Capacitor Android/iOS app, install the Cordova plugin used by the app code:

1. Install the plugin

```bash
cd frontend
npm install cordova-plugin-speechrecognition
npx cap sync
```

2. Android: ensure `RECORD_AUDIO` permission is present (the plugin should add it automatically). On modern Android versions the plugin requests runtime permission.

3. Rebuild the Android project and APK

```bash
cd frontend
npx cap copy android
cd android
.\gradlew assembleDebug
```

4. Run the app on device. The microphone button will use the native plugin. If the plugin is not installed or not available the code falls back to Web Speech API in compatible browsers.

Notes about plugin alternatives
- If you prefer Capacitor-native plugin approach, consider a maintained Capacitor community plugin for speech recognition and adapt the start/stop calls accordingly.

If you want, I can add the plugin automatically to the project and run the sync/build here; confirm and I will install `cordova-plugin-speechrecognition`, run `npx cap sync`, and rebuild the APK.

If you want, I can:
- Add a native Capacitor plugin for speech recognition for better mobile support.
- Improve parsing using `chrono-node` or another date parser.
- Add a confirmation dialog after parsing before overwriting form fields.
