import { Component, OnInit, ViewChild } from '@angular/core';
import * as chrono from 'chrono-node';
import { Capacitor } from '@capacitor/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, IonModal, ToastController, ModalController } from '@ionic/angular';
import { AppointmentService } from '../../services/appointment.service';
import { OperatorService } from '../../services/operator.service';
import { Operator } from '../../models/operator.model';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
})
export class BookingPage implements OnInit {
  @ViewChild('dateModal') dateModal!: IonModal;
  
  bookingForm!: FormGroup;
  operators: Operator[] = [];
  availableSlots: string[] = [];
  availableServices: string[] = [];
  selectedDate: string = '';
  loading = false;
  // Use date-only format for minDate (YYYY-MM-DD) to match ion-datetime 'date' presentation
  minDate: string = new Date().toISOString().split('T')[0];
  // Voice recognition
  recognition: any = null; // Web Speech API
  isRecording: boolean = false;
  lastTranscript: string = '';
  nativeSpeechAvailable: boolean = false;
  nativeListening: boolean = false;
  // Debug info
  debugInfo: string = '';
  lastError: string = '';
  platform: string = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private appointmentService: AppointmentService,
    private operatorService: OperatorService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    // detect native speech plugin presence (cordova plugin)
    try {
      const w: any = window as any;
      this.nativeSpeechAvailable = !!(w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition));
      this.platform = Capacitor.getPlatform();
      this.debugInfo = `Inizializzazione... Platform: ${this.platform}`;
    } catch (e) {
      this.nativeSpeechAvailable = false;
      this.debugInfo = `Errore init: ${e}`;
    }
  }
  
  goToHome() {
    this.router.navigate(['/home']);
  }
  
  goToAppointments() {
    this.router.navigate(['/appointments']);
  }
  
  openMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) {
      menu.open();
    }
  }

  ngOnInit(): void {
    this.bookingForm = this.formBuilder.group({
      operatoreId: [null, Validators.required],
      data: [this.minDate, Validators.required],
      slot: [null, Validators.required],
      servizio: ['', Validators.required],
      note: ['']
    });
    // ensure selectedDate reflects the form value so the datepicker shows today's date by default
    const dataVal = this.bookingForm.get('data')?.value;
    if (dataVal) {
      // store as full ISO string for ion-datetime binding
      this.selectedDate = new Date(dataVal).toISOString();
    }
    
    // Check for voice data from navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const voiceData = navigation.extras.state['voiceData'];
      const transcript = navigation.extras.state['transcript'];
      
      if (voiceData) {
        console.log('Voice data received:', voiceData);
        this.debugInfo = `Dati ricevuti: ${JSON.stringify(voiceData)}`;
        
        // Show toast with what was recognized
        let message = 'Comando vocale riconosciuto:\n';
        if (voiceData.servizio) message += `Servizio: ${voiceData.servizio}\n`;
        if (voiceData.data) message += `Data: ${voiceData.data}\n`;
        if (voiceData.slot) message += `Ora: ${voiceData.slot}\n`;
        if (voiceData.operatoreId) message += `Operatore: selezionato`;
        
        this.toastController.create({
          message: message,
          duration: 3000,
          position: 'top',
          color: 'success'
        }).then(toast => toast.present());
        
        // Apply voice data to form
        if (voiceData.operatoreId) {
          this.bookingForm.patchValue({ operatoreId: voiceData.operatoreId });
          // Trigger operator change to load slots
          setTimeout(() => {
            this.onDateOrOperatorChange();
          }, 100);
        }
        
        if (voiceData.data) {
          this.bookingForm.patchValue({ data: voiceData.data });
          this.selectedDate = new Date(voiceData.data).toISOString();
          // Load slots for the selected date
          setTimeout(() => {
            this.onDateChange();
          }, 200);
        }
        
        if (voiceData.slot) {
          // Wait a bit for slots to load, then select the slot
          setTimeout(() => {
            this.bookingForm.patchValue({ slot: voiceData.slot });
          }, 800);
        }
        
        if (voiceData.servizio) {
          this.bookingForm.patchValue({ servizio: voiceData.servizio });
        }
      }
    }
    
    this.loadOperators();
    this.loadServices();
  }

  // Parse transcript and return a patch object (do not apply automatically)
  parseTranscript(text: string): { patch: any; summary: string } {
    const t = text;
    const patch: any = {};
    let summaryParts: string[] = [];

    // Try Italian chrono locale first
    try {
      const chronoResults = (chrono as any).it ? (chrono as any).it.parse(t, new Date(), { forwardDate: true }) : chrono.parse(t, new Date(), { forwardDate: true });
      if (chronoResults && chronoResults.length > 0) {
        const r = chronoResults[0];
        const dt = r.start && r.start.date ? r.start.date() : null;
        if (dt && !isNaN(dt.getTime())) {
          const dateISO = dt.toISOString().split('T')[0];
          patch.data = dateISO;
          summaryParts.push(`Data: ${dateISO}`);

          const hasTime = r.start.isCertain && (r.start.isCertain('hour') || r.start.isCertain('minute'));
          if (hasTime || (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
            const hh = dt.getHours().toString().padStart(2, '0');
            const mm = dt.getMinutes().toString().padStart(2, '0');
            patch.slot = `${hh}:${mm}`;
            summaryParts.push(`Orario: ${patch.slot}`);
          }
        }

        // remaining text after removing r.text
        let remaining = t.replace(r.text, '');
        remaining = remaining.replace(/\b(alle|ore|a|per)\b/ig, '');

        // operator matching
        if (this.operators && this.operators.length) {
          for (const op of this.operators) {
            const fullName = (op.userId.nome + ' ' + op.userId.cognome).toLowerCase();
            if (remaining.toLowerCase().includes(op.userId.nome.toLowerCase()) || remaining.toLowerCase().includes(op.userId.cognome.toLowerCase()) || remaining.toLowerCase().includes(fullName)) {
              patch.operatoreId = op._id ?? null;
              summaryParts.push(`Operatore: ${op.userId.nome} ${op.userId.cognome}`);
              remaining = remaining.replace(new RegExp(op.userId.nome, 'ig'), '').replace(new RegExp(op.userId.cognome, 'ig'), '');
              break;
            }
          }
        }

        const serviceText = remaining.replace(/(prenotare|prenotazione|prenota|voglio|vorrei|per|con|da|oggi|domani|dopodomani)/ig, '').trim();
        if (serviceText) {
          patch.servizio = serviceText;
          summaryParts.push(`Servizio: ${serviceText}`);
        }
      }
    } catch (e) {
      console.warn('chrono parse failed', e);
    }

    // If chrono didn't produce fields, fallback to heuristics
    if (Object.keys(patch).length === 0) {
      const low = t.toLowerCase();
      if (low.includes('oggi')) {
        patch.data = new Date().toISOString().split('T')[0];
        summaryParts.push(`Data: ${patch.data}`);
      } else if (low.includes('domani')) {
        const d = new Date(); d.setDate(d.getDate() + 1); patch.data = d.toISOString().split('T')[0]; summaryParts.push(`Data: ${patch.data}`);
      } else if (low.includes('dopodomani')) {
        const d = new Date(); d.setDate(d.getDate() + 2); patch.data = d.toISOString().split('T')[0]; summaryParts.push(`Data: ${patch.data}`);
      }

      let timeMatch = low.match(/(\d{1,2}[:.]\d{2})/);
      if (!timeMatch) {
        const hourMatch = low.match(/(?:alle|ore)?\s*(\d{1,2})(?:\s*(?:e|:|,|\.|\s)\s*(\d{1,2}))?/);
        if (hourMatch) {
          const hh = parseInt(hourMatch[1], 10);
          const mm = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
          timeMatch = [`${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`, `${hh}`, `${mm}`];
        }
      }
      if (timeMatch) {
        const time = timeMatch[1] || timeMatch[0];
        const normalized = time.replace('.', ':');
        const parts = normalized.split(':');
        const hh = parts[0].padStart(2,'0');
        const mm = (parts[1] || '00').padStart(2,'0');
        patch.slot = `${hh}:${mm}`;
        summaryParts.push(`Orario: ${patch.slot}`);
      }

      // operator
      if (this.operators && this.operators.length) {
        for (const op of this.operators) {
          const fullName = (op.userId.nome + ' ' + op.userId.cognome).toLowerCase();
          if (low.includes(op.userId.nome.toLowerCase()) || low.includes(op.userId.cognome.toLowerCase()) || low.includes(fullName)) {
            patch.operatoreId = op._id ?? null;
            summaryParts.push(`Operatore: ${op.userId.nome} ${op.userId.cognome}`);
            break;
          }
        }
      }

      // service
      let serviceText = t.replace(/(oggi|domani|dopodomani)/ig, '');
      if (timeMatch) serviceText = serviceText.replace(timeMatch[0], '');
      if (patch.operatoreId) {
        const op = this.operators.find(o => o._id === patch.operatoreId);
        if (op) serviceText = serviceText.replace(new RegExp(op.userId.nome, 'ig'), '').replace(new RegExp(op.userId.cognome, 'ig'), '');
      }
      serviceText = serviceText.replace(/(prenotare|prenotazione|prenota|voglio|vorrei|per|con|da|alle|ore)/ig, '').trim();
      if (serviceText) { patch.servizio = serviceText; summaryParts.push(`Servizio: ${serviceText}`); }
    }

    const summary = summaryParts.join('; ');
    return { patch, summary };
  }

  // handle transcript: parse, ask confirmation and apply
  async handleTranscript(text: string) {
    if (!text) return;
    const { patch, summary } = this.parseTranscript(text);
    this.lastTranscript = text;
    if (!patch || Object.keys(patch).length === 0) {
      // nothing parsed, still show transcript
      return;
    }
    // present confirmation
    const header = 'Conferma valori rilevati';
    const message = summary || text;
    const alert = await this.alertController.create({
      header,
      message: `<div style="text-align:left">${message.replace(/\n/g,'<br/>')}</div>`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Applica', handler: () => { this.bookingForm.patchValue(patch); if (patch.operatoreId && patch.data) { this.onDateOrOperatorChange(); } } }
      ]
    });
    await alert.present();
  }

  // Toggle voice input (native if available, otherwise web Speech API)
  async toggleVoiceInput() {
    this.debugInfo = 'Click microfono rilevato!';
    console.log('toggleVoiceInput called', {
      nativeSpeechAvailable: this.nativeSpeechAvailable,
      nativeListening: this.nativeListening,
      isRecording: this.isRecording,
      platform: Capacitor.getPlatform()
    });

    // Request microphone permission first on web/hybrid
    if (!this.nativeSpeechAvailable) {
      this.debugInfo = 'Richiesta permessi microfono...';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        this.debugInfo = 'Permesso microfono OK, avvio riconoscimento...';
        console.log('Microphone permission granted');
      } catch (err) {
        console.error('Microphone permission denied', err);
        this.lastError = `Permesso negato: ${err}`;
        this.debugInfo = 'ERRORE: Permesso microfono negato';
        this.alertController.create({ 
          header: 'Permesso richiesto', 
          message: 'Per usare il riconoscimento vocale, concedi l\'accesso al microfono nelle impostazioni del dispositivo.', 
          buttons: ['OK'] 
        }).then(a => a.present());
        return;
      }
    }

    if (this.nativeSpeechAvailable) {
      this.debugInfo = 'Uso plugin nativo...';
      if (!this.nativeListening) this.startNativeListening();
      else this.stopNativeListening();
    } else {
      this.debugInfo = 'Uso Web Speech API...';
      if (!this.isRecording) this.startWebRecognition();
      else this.stopWebRecognition();
    }
  }

  // Web Speech API handlers
  startWebRecognition() {
    this.debugInfo = 'Avvio Web Speech API...';
    console.log('startWebRecognition called');
    const w: any = window as any;
    const SpeechRecognition = w.webkitSpeechRecognition || w.SpeechRecognition;
    console.log('SpeechRecognition available:', !!SpeechRecognition);
    
    if (!SpeechRecognition) {
      this.debugInfo = 'ERRORE: Web Speech API non disponibile';
      this.lastError = 'SpeechRecognition non supportato su questo dispositivo/browser';
      this.alertController.create({ 
        header: 'Errore', 
        message: 'SpeechRecognition non supportato. Prova con un browser diverso o aggiorna l\'app.', 
        buttons: ['OK'] 
      }).then(a => a.present());
      return;
    }
    
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'it-IT';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isRecording = true;
        this.debugInfo = '🎤 Microfono attivo - Parla ora!';
        this.lastError = '';
      };
      
      this.recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        this.debugInfo = `Riconosciuto: "${transcript}"`;
        this.handleTranscript(transcript);
      };
      
      this.recognition.onerror = (err: any) => {
        console.error('recognition error', err);
        this.isRecording = false;
        this.lastError = `Errore: ${err.error}`;
        this.debugInfo = `ERRORE riconoscimento: ${err.error}`;
        this.alertController.create({ 
          header: 'Errore Riconoscimento', 
          message: `Errore: ${err.error || 'Sconosciuto'}. Riprova.`, 
          buttons: ['OK'] 
        }).then(a => a.present());
      };
      
      this.recognition.onend = () => { 
        console.log('Speech recognition ended');
        this.isRecording = false; 
        if (!this.lastError) {
          this.debugInfo = 'Riconoscimento completato';
        }
      };
      
      this.recognition.start();
      console.log('Recognition start() called');
    } catch (e) {
      console.error('Failed to start recognition:', e);
      this.debugInfo = `ERRORE start: ${e}`;
      this.lastError = String(e);
      this.alertController.create({ 
        header: 'Errore', 
        message: 'Impossibile avviare il riconoscimento vocale. Controlla i permessi del microfono.', 
        buttons: ['OK'] 
      }).then(a => a.present());
    }
  }

  stopWebRecognition() {
    try {
      if (this.recognition) this.recognition.stop();
    } catch (e) { console.warn('stopWebRecognition error', e); }
    this.isRecording = false;
  }

  // Native plugin handlers (cordova-plugin-speechrecognition)
  startNativeListening() {
    this.debugInfo = 'Avvio plugin nativo...';
    console.log('startNativeListening called');
    const w: any = window as any;
    const plugin = w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition);
    console.log('Native plugin available:', !!plugin);
    
    if (!plugin) {
      this.nativeSpeechAvailable = false;
      this.debugInfo = 'ERRORE: Plugin nativo non trovato';
      this.lastError = 'Plugin cordova-plugin-speechrecognition non installato';
      this.alertController.create({ 
        header: 'Errore', 
        message: 'Plugin voce non disponibile. Uso fallback Web Speech API.', 
        buttons: ['OK'] 
      }).then(a => a.present());
      // Fallback to web
      this.startWebRecognition();
      return;
    }
    
    // Check permissions
    if (plugin.hasPermission) {
      plugin.hasPermission((hasPermission: boolean) => {
        console.log('Has permission:', hasPermission);
        this.debugInfo = `Permessi: ${hasPermission ? 'OK' : 'Richiesta...'}`;
        if (!hasPermission) {
          plugin.requestPermission(() => {
            console.log('Permission granted, starting...');
            this.debugInfo = 'Permessi OK, avvio...';
            this.doStartNativeListening(plugin);
          }, (err: any) => {
            console.error('Permission denied:', err);
            this.debugInfo = 'ERRORE: Permessi negati';
            this.lastError = `Permessi negati: ${err}`;
            this.alertController.create({ 
              header: 'Permesso richiesto', 
              message: 'Concedi l\'accesso al microfono nelle impostazioni.', 
              buttons: ['OK'] 
            }).then(a => a.present());
          });
        } else {
          this.doStartNativeListening(plugin);
        }
      }, (err: any) => {
        console.error('hasPermission error:', err);
        this.debugInfo = 'Errore verifica permessi, provo comunque...';
        this.doStartNativeListening(plugin);
      });
    } else {
      this.debugInfo = 'Plugin senza gestione permessi, avvio diretto...';
      this.doStartNativeListening(plugin);
    }
  }

  doStartNativeListening(plugin: any) {
    try {
      this.debugInfo = '🎤 Plugin nativo attivo - Parla ora!';
      plugin.startListening((matches: any) => {
        console.log('Native recognition matches:', matches);
        if (matches && matches.length) {
          this.debugInfo = `Riconosciuto (nativo): "${matches[0]}"`;
          this.handleTranscript(matches[0]);
        } else {
          this.debugInfo = 'Nessun risultato riconosciuto';
        }
        this.nativeListening = false;
      }, (err: any) => {
        console.error('startListening error', err);
        this.nativeListening = false;
        this.debugInfo = `ERRORE plugin: ${err}`;
        this.lastError = String(err);
        this.alertController.create({ 
          header: 'Errore', 
          message: `Errore riconoscimento: ${err}`, 
          buttons: ['OK'] 
        }).then(a => a.present());
      }, { language: 'it-IT', showPopup: false });
      this.nativeListening = true;
      console.log('Native listening started');
    } catch (e) {
      console.error('startNativeListening failed', e);
      this.nativeListening = false;
      this.debugInfo = `ERRORE exception: ${e}`;
      this.lastError = String(e);
      this.alertController.create({ 
        header: 'Errore', 
        message: 'Impossibile avviare il riconoscimento vocale.', 
        buttons: ['OK'] 
      }).then(a => a.present());
    }
  }

  stopNativeListening() {
    const w: any = window as any;
    const plugin = w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition);
    if (!plugin) return;
    try {
      if (plugin.stopListening) {
        plugin.stopListening(() => { this.nativeListening = false; }, (err: any) => { console.error('stopListening error', err); this.nativeListening = false; });
      } else {
        this.nativeListening = false;
      }
    } catch (e) {
      console.error('stopListening failed', e); this.nativeListening = false;
    }
  }

  applyTranscriptToForm(text: string) {
    if (!text) return;
    // Lowercase for parsing
    const t = text;

    // First try chrono-node to parse date/time entities
    try {
      const results: any[] = chrono.parse(t, new Date(), { forwardDate: true });
      const patch: any = {};

      if (results && results.length > 0) {
        const r = results[0];
        // remove the parsed text from the service text
        let remaining = t.replace(r.text, '');
        const dt = r.start && r.start.date ? r.start.date() : null;
        if (dt && !isNaN(dt.getTime())) {
          // set date
          const dateISO = dt.toISOString().split('T')[0];
          patch.data = dateISO;
          this.selectedDate = new Date(dateISO).toISOString();

          // set slot if time is present (hour/minute)
          const hasTime = r.start.isCertain && (r.start.isCertain('hour') || r.start.isCertain('minute'));
          if (hasTime || (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
            const hh = dt.getHours().toString().padStart(2, '0');
            const mm = dt.getMinutes().toString().padStart(2, '0');
            patch.slot = `${hh}:${mm}`;
          }

          // try to remove surrounding prepositions
          remaining = remaining.replace(/\b(alle|ore|a|per)\b/ig, '');
        }

        // try operator matching on remaining text
        let matchedOperatorId: string | null = null;
        if (this.operators && this.operators.length) {
          for (const op of this.operators) {
            const fullName = (op.userId.nome + ' ' + op.userId.cognome).toLowerCase();
            if (remaining.toLowerCase().includes(op.userId.nome.toLowerCase()) || remaining.toLowerCase().includes(op.userId.cognome.toLowerCase()) || remaining.toLowerCase().includes(fullName)) {
              matchedOperatorId = op._id ?? null;
              // remove operator name from remaining
              remaining = remaining.replace(new RegExp(op.userId.nome, 'ig'), '').replace(new RegExp(op.userId.cognome, 'ig'), '');
              break;
            }
          }
        }

        if (matchedOperatorId) patch.operatoreId = matchedOperatorId;

        // remaining text as servizio
        const serviceText = remaining.replace(/(prenotare|prenotazione|prenota|voglio|vorrei|per|con|da|oggi|domani|dopodomani)/ig, '').trim();
        if (serviceText) patch.servizio = serviceText;

        if (Object.keys(patch).length) {
          this.bookingForm.patchValue(patch);
          if (patch.operatoreId && patch.data) this.onDateOrOperatorChange();
        }
        this.lastTranscript = text;
        return;
      }
    } catch (e) {
      console.warn('chrono parse failed', e);
    }

    // Fallback heuristics (previous logic) — lowercase note
    const low = t.toLowerCase();

    // Check for relative dates
    let dateISO: string | null = null;
    if (low.includes('oggi')) {
      dateISO = new Date().toISOString().split('T')[0];
    } else if (low.includes('domani')) {
      const d = new Date(); d.setDate(d.getDate() + 1); dateISO = d.toISOString().split('T')[0];
    } else if (low.includes('dopodomani')) {
      const d = new Date(); d.setDate(d.getDate() + 2); dateISO = d.toISOString().split('T')[0];
    }

    // Time detection (hh[:.]mm or 'alle 15' or 'ore 15 e 30')
    let timeMatch = low.match(/(\d{1,2}[:.]\d{2})/);
    if (!timeMatch) {
      const hourMatch = low.match(/(?:alle|ore)?\s*(\d{1,2})(?:\s*(?:e|:|,|\.|\s)\s*(\d{1,2}))?/);
      if (hourMatch) {
        const hh = parseInt(hourMatch[1], 10);
        const mm = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
        timeMatch = [`${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`, `${hh}`, `${mm}`];
      }
    }

    // Try to match operator by name
    let matchedOperatorId: string | null = null;
    if (this.operators && this.operators.length) {
      for (const op of this.operators) {
        const fullName = (op.userId.nome + ' ' + op.userId.cognome).toLowerCase();
        if (low.includes(op.userId.nome.toLowerCase()) || low.includes(op.userId.cognome.toLowerCase()) || low.includes(fullName)) {
          matchedOperatorId = op._id ?? null;
          break;
        }
      }
    }

    // Autofill form controls
    const patch2: any = {};
    if (matchedOperatorId) patch2.operatoreId = matchedOperatorId;
    if (dateISO) {
      patch2.data = dateISO;
      this.selectedDate = new Date(dateISO).toISOString();
    }
    if (timeMatch) {
      const time = timeMatch[1] || timeMatch[0];
      // normalize separator
      const normalized = time.replace('.', ':');
      const parts = normalized.split(':');
      const hh = parts[0].padStart(2,'0');
      const mm = (parts[1] || '00').padStart(2,'0');
      patch2.slot = `${hh}:${mm}`;
    }

    // Service: try to remove date/time/operator words
    let serviceText = text;
    // remove matched date and time substrings — simple removals
    serviceText = serviceText.replace(/(oggi|domani|dopodomani)/ig, '');
    if (timeMatch) serviceText = serviceText.replace(timeMatch[0], '');
    if (matchedOperatorId) {
      const op = this.operators.find(o => o._id === matchedOperatorId);
      if (op) serviceText = serviceText.replace(new RegExp(op.userId.nome, 'ig'), '').replace(new RegExp(op.userId.cognome, 'ig'), '');
    }
    serviceText = serviceText.replace(/(prenotare|prenotazione|prenota|voglio|vorrei|per|con|da|alle|ore)/ig, '');
    serviceText = serviceText.trim();
    if (serviceText) patch2.servizio = serviceText;

    // Apply patches to form
    if (Object.keys(patch2).length) {
      this.bookingForm.patchValue(patch2);
      // trigger loading of slots if operator and date present
      if (patch2.operatoreId && patch2.data) {
        this.onDateOrOperatorChange();
      }
    }
    this.lastTranscript = text;
  }

  loadOperators() {
    this.operatorService.getActive().subscribe({
      next: (operators: Operator[]) => {
        this.operators = operators;
      },
      error: (error: any) => {
        console.error('Errore caricamento operatori', error);
      }
    });
  }

  loadServices() {
    this.appointmentService.getUniqueServices().subscribe({
      next: (services: string[]) => {
        this.availableServices = services;
      },
      error: (error: any) => {
        console.error('Errore caricamento servizi', error);
        // Fallback to default services if endpoint fails
        this.availableServices = ['Taglio', 'Colore', 'Piega', 'Taglio + Piega', 'Barba', 'Trattamento'];
      }
    });
  }

  onDateChange() {
    if (this.selectedDate) {
      // Converti la data ISO in formato YYYY-MM-DD
      const dateObj = new Date(this.selectedDate);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      // Aggiorna il form control con la data selezionata
      this.bookingForm.patchValue({ data: formattedDate });
      this.onDateOrOperatorChange();
    }
  }

  onDateOrOperatorChange() {
    const operatoreId = this.bookingForm.get('operatoreId')?.value;
    const data = this.bookingForm.get('data')?.value;

    if (operatoreId && data) {
      this.loadAvailableSlots(operatoreId, data);
    }
  }

  loadAvailableSlots(operatoreId: string, data: string) {
    this.loading = true;
    this.appointmentService.getAvailableSlots(operatoreId, data).subscribe({
      next: (result) => {
        this.availableSlots = result.slots;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.availableSlots = [];
      }
    });
  }

  async onSubmit() {
    if (this.bookingForm.invalid) {
      console.log('Form invalido:', this.bookingForm.value);
      console.log('Errori:', this.bookingForm.errors);
      return;
    }
formValue = this.bookingForm.value;
    console.log('Form values:', formValue);
    
    const [hours, minutes] = formValue.slot.split(':');
    
    // Crea la data in modo esplicito per evitare problemi di timezone
    const dateParts = formValue.data.split('-');
    const dataOra = new Date(
      parseInt(dateParts[0]), // year
      parseInt(dateParts[1]) - 1, // month (0-indexed)
      parseInt(dateParts[2]), // day
      parseInt(hours),
      parseInt(minutes),
      0,
      0
    );

    // Ottieni il prezzo del servizio dall'operatore
    const selectedOperator = this.operators.find(op => op._id === formValue.operatoreId);
    const servicePrice = selectedOperator?.servizi.find(s => s.nome === formValue.servizio)?.prezzo || 0;

    // Mostra modal di pagamento se c'è un prezzo
    if (servicePrice > 0) {
      const modal = await this.modalController.create({
        component: PaymentModalComponent,
        componentProps: {
          amount: servicePrice,
          appointmentId: '' // Verrà impostato dopo la creazione dell'appuntamento
        },
        cssClass: 'payment-modal'
      });

      await modal.present();
      const { data } = await modal.onDidDismiss();

      if (data && data.success) {
        // Crea appuntamento con info di pagamento
        await this.createAppointmentWithPayment(dataOra, formValue, data.method, data.paid);
      }
    } else {
      // Crea appuntamento senza pagamento
      await this.createAppointmentWithPayment(dataOra, formValue, 'non-pagato', false);
    }
  }

  private async createAppointmentWithPayment(
    dataOra: Date,
    formValue: any,
    paymentMethod: string,
    paid: boolean
  ) {
    const loading = await this.loadingController.create({
      message: 'Prenotazione in corso...'
    });
    await loading.present();

    const appointmentData = {
      operatoreId: formValue.operatoreId,
      dataOra: dataOra.toISOString(),
      servizio: formValue.servizio,
      note: formValue.note,
      metodoPagamento: paymentMethod,
      pagato: paid
    };
    
    console.log('Appointment data to send:', appointmentData);

    this.appointmentService.create(appointmentData).subscribe({
      next: async () => {
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Successo',
          message: paid 
            ? 'Appuntamento prenotato e pagato con successo!' 
             'Successo',
          message: 'Appuntamento prenotato con successo!',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.router.navigate(['/appointments']);
            }
          }]
        });
        await alert.present();
      },
      error: async (error: any) => {
        loading.dismiss();
        console.error('Errore completo:', error);
        const alert = await this.alertController.create({
          header: 'Errore',
          message: error.error?.message || 'Errore durante la prenotazione',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  openDatePicker() {
    this.dateModal.present();
  }

  getFormattedDate(): string {
    // Prefer the reactive form value, fallback to selectedDate
    const formDate = this.bookingForm?.get('data')?.value;
    const useDate = formDate || this.selectedDate;
    if (!useDate) return '';
    const date = new Date(useDate);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
}
