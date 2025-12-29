# 🚀 Guida Rapida - Avvio Applicazione

## Passo 1: Installazione Backend

```powershell
# Naviga nella cartella backend
cd backend

# Installa le dipendenze
npm install

# Crea file .env dalla copia di esempio
copy .env.example .env

# IMPORTANTE: Modifica il file .env con le tue configurazioni
# Apri .env e personalizza:
# - MONGODB_URI (se usi MongoDB Atlas o altro)
# - JWT_SECRET (genera un token sicuro)
```

## Passo 2: Avvia MongoDB

### Opzione A: MongoDB Locale
```powershell
# Se hai MongoDB installato localmente
mongod
```

### Opzione B: MongoDB Atlas (Cloud)
1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un account gratuito
3. Crea un cluster
4. Ottieni la connection string
5. Aggiornala nel file `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salon-booking
   ```

## Passo 3: Avvia il Backend

```powershell
# Dalla cartella backend
npm run dev

# Il server sarà disponibile su http://localhost:3000
# Verifica che funzioni: http://localhost:3000
```

## Passo 4: Installazione Frontend

```powershell
# Apri un nuovo terminale
# Naviga nella cartella frontend
cd frontend

# Installa le dipendenze
npm install

# Verifica il file di ambiente
# Apri src/environments/environment.ts
# Assicurati che apiUrl sia: http://localhost:3000/api
```

## Passo 5: Avvia il Frontend

```powershell
# Dalla cartella frontend
ionic serve

# L'app sarà disponibile su http://localhost:8100
# Il browser si aprirà automaticamente
```

## 🎯 Test dell'Applicazione

### 1. Crea un utente Admin

```powershell
# Usa questo comando per creare un admin
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "nome": "Admin",
    "cognome": "Test",
    "email": "admin@test.it",
    "telefono": "3331234567",
    "password": "admin123",
    "ruolo": "admin"
  }'
```

### 2. Accedi all'app

1. Apri http://localhost:8100
2. Clicca su "Registrati" o usa le credenziali admin:
   - Email: admin@test.it
   - Password: admin123

### 3. Inizializza le configurazioni (come Admin)

```powershell
# Questo crea le configurazioni di default
curl -X POST http://localhost:3000/api/config/init `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Crea un operatore

Dall'area admin dell'app:
1. Vai su "Gestione Admin"
2. Vai alla sezione "Operatori"
3. Oppure usa l'API:

```powershell
# Prima crea un utente operatore
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario@test.it",
    "telefono": "3339876543",
    "password": "operatore123"
  }'

# Poi crea l'operatore (serve l'ID utente dalla risposta precedente)
curl -X POST http://localhost:3000/api/operators `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -d '{
    "userId": "USER_ID_QUI",
    "specializzazione": "Parrucchiere",
    "descrizione": "Specialista in tagli moderni",
    "colore": "#3880ff",
    "disponibilita": [
      {
        "giornoSettimana": 1,
        "oraInizio": "09:00",
        "oraFine": "18:00",
        "pausaPranzoInizio": "13:00",
        "pausaPranzoFine": "14:00"
      },
      {
        "giornoSettimana": 2,
        "oraInizio": "09:00",
        "oraFine": "18:00"
      }
    ]
  }'
```

## 🔍 Risoluzione Problemi Comuni

### Backend non si avvia
- **Errore MongoDB**: Assicurati che MongoDB sia in esecuzione
- **Porta occupata**: Cambia PORT nel file .env
- **node_modules**: Prova `rm -rf node_modules` e `npm install`

### Frontend non si avvia
- **Errori di compilazione**: Verifica di avere Node.js v18+
- **Ionic non trovato**: Installa `npm install -g @ionic/cli`
- **CORS errors**: Verifica che il backend sia avviato

### Problemi di autenticazione
- **Token scaduto**: Fai logout e login
- **401 Unauthorized**: Verifica JWT_SECRET nel backend
- **Email già registrata**: Usa un'altra email o cambia nel DB

## 📱 Build per Mobile

### Android
```powershell
cd frontend
ionic capacitor add android
ionic build --prod
ionic capacitor copy android
ionic capacitor open android
```

### iOS (solo su Mac)
```powershell
cd frontend
ionic capacitor add ios
ionic build --prod
ionic capacitor copy ios
ionic capacitor open ios
```

## 🎨 Personalizzazione

### Cambia colori tema
Modifica `frontend/src/theme/variables.scss`

### Modifica logo
Sostituisci i file in `frontend/src/assets/icon/`

### Cambia nome app
Modifica `name` in `frontend/capacitor.config.json`

## 📞 Supporto

Se hai problemi:
1. Controlla i log del backend nel terminale
2. Controlla la console del browser (F12)
3. Verifica che MongoDB sia connesso
4. Controlla che le porte 3000 e 8100 siano libere

---

**Buon lavoro! 🚀**
