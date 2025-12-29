# hairIT App

Applicazione completa per la gestione delle prenotazioni.

## 📱 Struttura Progetto

```
hairit-app/
├── backend/          # Backend Node.js + Express + MongoDB
└── frontend/         # Frontend Ionic Angular
```

## 🚀 Tecnologie Utilizzate

### Backend
- **Node.js** + **Express.js** - Server API REST
- **MongoDB** + **Mongoose** - Database NoSQL
- **JWT** - Autenticazione e autorizzazione
- **bcryptjs** - Hashing password

### Frontend
- **Ionic 7** - Framework per app ibride
- **Angular 17** - Framework frontend
- **RxJS** - Programmazione reattiva
- **TypeScript** - Linguaggio tipizzato

## ✨ Funzionalità

### Per i Clienti
- ✅ Registrazione e login
- ✅ Prenotazione appuntamenti
- ✅ Visualizzazione appuntamenti passati e futuri
- ✅ Modifica e cancellazione prenotazioni
- ✅ Selezione operatore e slot orari disponibili

### Per gli Admin
- ✅ Gestione operatori (CRUD)
- ✅ Configurazione intervalli di prenotazione
- ✅ Configurazione orari di lavoro per operatore
- ✅ Gestione disponibilità operatori per giorno della settimana
- ✅ Configurazione pause pranzo
- ✅ Visualizzazione di tutti gli appuntamenti

## 📦 Installazione

### Prerequisiti
- Node.js (v18 o superiore)
- MongoDB (v6 o superiore)
- Ionic CLI: `npm install -g @ionic/cli`

### Setup Backend

```powershell
cd backend

# Installa dipendenze
npm install

# Copia file environment
copy .env.example .env

# Modifica .env con le tue configurazioni
# Esempio:
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/salon-booking
# JWT_SECRET=il_tuo_secret_jwt_sicuro

# Avvia MongoDB (se locale)
# mongod

# Avvia server
npm run dev
```

### Setup Frontend

```powershell
cd frontend

# Installa dipendenze
npm install

# Modifica src/environments/environment.ts se necessario
# Verifica che apiUrl punti al tuo backend

# Avvia app in modalità sviluppo
ionic serve
```

L'applicazione sarà disponibile su `http://localhost:8100`

## 🗄️ Modelli Database

### User
- Nome, Cognome, Email, Telefono
- Password (hashata)
- Ruolo: cliente | admin | operatore

### Operator
- Riferimento a User
- Specializzazione
- Disponibilità (array di orari per giorno settimana)
- Colore (per visualizzazione)

### Appointment
- Cliente (ref User)
- Operatore (ref Operator)
- Data e ora
- Durata (minuti)
- Servizio
- Stato: confermato | completato | cancellato | in-attesa
- Note e prezzo

### Configuration
- Chiave/valore per configurazioni globali
- Intervallo prenotazione (default 30 min)
- Orari apertura/chiusura
- Giorni lavorativi
- Anticipo minimo prenotazione

## 🔐 API Endpoints

### Autenticazione
```
POST /api/auth/register  - Registrazione utente
POST /api/auth/login     - Login
GET  /api/auth/profile   - Profilo utente (protetto)
```

### Appuntamenti
```
POST   /api/appointments              - Crea appuntamento (protetto)
GET    /api/appointments              - Lista appuntamenti (protetto)
GET    /api/appointments/:id          - Dettaglio appuntamento (protetto)
PUT    /api/appointments/:id          - Modifica appuntamento (protetto)
DELETE /api/appointments/:id          - Cancella appuntamento (protetto)
GET    /api/appointments/available-slots - Slot disponibili (pubblico)
```

### Operatori
```
POST   /api/operators                 - Crea operatore (admin)
GET    /api/operators                 - Lista operatori (pubblico)
GET    /api/operators/:id             - Dettaglio operatore (pubblico)
PUT    /api/operators/:id             - Modifica operatore (admin)
DELETE /api/operators/:id             - Elimina operatore (admin)
PUT    /api/operators/:id/disponibilita - Aggiorna disponibilità (admin)
```

### Configurazioni
```
GET    /api/config                    - Tutte le configurazioni (admin)
GET    /api/config/:chiave            - Configurazione per chiave (pubblico)
PUT    /api/config/:chiave            - Aggiorna configurazione (admin)
DELETE /api/config/:chiave            - Elimina configurazione (admin)
POST   /api/config/init               - Inizializza config default (admin)
```

## 👤 Utenti di Test

Dopo aver avviato il backend, puoi creare un utente admin tramite API:

```powershell
# Registra utente admin
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "nome": "Admin",
    "cognome": "Salone",
    "email": "admin@salone.it",
    "telefono": "1234567890",
    "password": "admin123",
    "ruolo": "admin"
  }'
```

## 📱 Build per Produzione

### Backend
```powershell
cd backend
# Configura .env per produzione
npm start
```

### Frontend
```powershell
cd frontend
# Build produzione
ionic build --prod

# Per Android
ionic capacitor add android
ionic capacitor copy android
ionic capacitor open android

# Per iOS (solo su Mac)
ionic capacitor add ios
ionic capacitor copy ios
ionic capacitor open ios
```

## 🔧 Configurazione Avanzata

### Intervalli di Prenotazione Personalizzati
Accedi come admin e vai alla sezione "Gestione Admin" > "Configurazioni"
- Modifica `intervalloPrenotazione` (default 30 minuti)
- Puoi impostare 15, 30, 45, 60 minuti ecc.

### Gestione Disponibilità Operatori
1. Crea un utente con ruolo `operatore`
2. Associalo come operatore dall'area admin
3. Configura gli orari per ogni giorno della settimana:
   - Giorni lavorativi (0=Domenica, 6=Sabato)
   - Orario inizio/fine
   - Pausa pranzo (opzionale)

### Esempio Disponibilità
```json
{
  "giornoSettimana": 1,
  "oraInizio": "09:00",
  "oraFine": "18:00",
  "pausaPranzoInizio": "13:00",
  "pausaPranzoFine": "14:00"
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verifica che MongoDB sia avviato
- Controlla `MONGODB_URI` in `.env`

### CORS Errors
- Backend e frontend devono essere su domini/porte configurati
- Verifica configurazione CORS in `backend/server.js`

### Token Expired
- I token JWT scadono dopo 30 giorni
- Logout e login per ottenere nuovo token

## 📝 TODO / Miglioramenti Futuri
- [ ] Notifiche push per reminder appuntamenti
- [ ] Integrazione pagamenti online
- [ ] Chat tra cliente e salone
- [ ] Sistema di recensioni
- [ ] Statistiche e report per admin
- [ ] Multi-lingua
- [ ] Dark mode

## 📄 Licenza
Questo progetto è di proprietà privata. Tutti i diritti riservati.

## 👨‍💻 Supporto
Per domande o problemi, contattare lo sviluppatore.

---

**Nota**: Questa è un'applicazione completa e funzionale. Per utilizzarla in produzione, assicurati di:
- Cambiare il JWT_SECRET in .env
- Configurare MongoDB in un servizio cloud (es. MongoDB Atlas)
- Implementare HTTPS
- Configurare backup regolari del database
- Aggiungere rate limiting alle API
- Implementare logging e monitoring
