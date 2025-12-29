import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular';
import * as chrono from 'chrono-node';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { OperatorService } from '../../services/operator.service';
import { Appointment } from '../../models/appointment.model';
import { Operator } from '../../models/operator.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  upcomingAppointments: Appointment[] = [];
  loading = false;
  operators: Operator[] = [];
  currentYear: number = new Date().getFullYear();
  
  // Voice recognition
  recognition: any = null;
  isRecording: boolean = false;
  nativeSpeechAvailable: boolean = false;
  nativeListening: boolean = false;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private operatorService: OperatorService,
    private router: Router,
    private alertController: AlertController
  ) {
    // Detect native speech plugin
    try {
      const w: any = window as any;
      this.nativeSpeechAvailable = !!(w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition));
    } catch (e) {
      this.nativeSpeechAvailable = false;
    }
  }
  
  goToHome() {
    // Already on home
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
  
  openMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) {
      menu.open();
    }
  }

  ngOnInit() {
    // Se l'utente è admin, reindirizza all'area admin
    if (this.authService.isAdmin) {
      this.router.navigate(['/admin']);
      return;
    }
    this.loadUpcomingAppointments();
    this.loadOperators();
  }

  ionViewWillEnter() {
    // Se l'utente è admin, reindirizza all'area admin
    if (this.authService.isAdmin) {
      this.router.navigate(['/admin']);
      return;
    }
    this.loadUpcomingAppointments();
  }

  loadUpcomingAppointments() {
    this.loading = true;
    this.appointmentService.getAll({ stato: 'confermato' }).subscribe({
      next: (appointments) => {
        const now = new Date();
        this.upcomingAppointments = appointments
          .filter(apt => new Date(apt.dataOra) >= now)
          .sort((a, b) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime())
          .slice(0, 5);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadOperators() {
    this.operatorService.getAll().subscribe({
      next: (operators) => {
        this.operators = operators;
      },
      error: (err) => {
        console.error('Error loading operators:', err);
      }
    });
  }

  goToBooking() {
    this.router.navigate(['/booking']);
  }

  goToAppointments() {
    this.router.navigate(['/appointments']);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  // Voice recognition methods
  async toggleVoiceInput() {
    if (!this.nativeSpeechAvailable) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        this.alertController.create({ 
          header: 'Permesso richiesto', 
          message: 'Per usare il riconoscimento vocale, concedi l\'accesso al microfono.', 
          buttons: ['OK'] 
        }).then(a => a.present());
        return;
      }
    }

    if (this.nativeSpeechAvailable) {
      if (!this.nativeListening) this.startNativeListening();
      else this.stopNativeListening();
    } else {
      if (!this.isRecording) this.startWebRecognition();
      else this.stopWebRecognition();
    }
  }

  startWebRecognition() {
    const w: any = window as any;
    const SpeechRecognition = w.webkitSpeechRecognition || w.SpeechRecognition;
    
    if (!SpeechRecognition) {
      this.alertController.create({ 
        header: 'Errore', 
        message: 'Riconoscimento vocale non supportato su questo dispositivo.', 
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
        this.isRecording = true;
      };
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.handleTranscript(transcript);
      };
      
      this.recognition.onerror = (err: any) => {
        this.isRecording = false;
      };
      
      this.recognition.onend = () => { 
        this.isRecording = false; 
      };
      
      this.recognition.start();
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  }

  stopWebRecognition() {
    try {
      if (this.recognition) this.recognition.stop();
    } catch (e) { }
    this.isRecording = false;
  }

  startNativeListening() {
    const w: any = window as any;
    const plugin = w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition);
    
    if (!plugin) {
      this.nativeSpeechAvailable = false;
      this.startWebRecognition();
      return;
    }
    
    if (plugin.hasPermission) {
      plugin.hasPermission((hasPermission: boolean) => {
        if (!hasPermission) {
          plugin.requestPermission(() => {
            this.doStartNativeListening(plugin);
          }, (err: any) => {
            console.error('Permission denied:', err);
          });
        } else {
          this.doStartNativeListening(plugin);
        }
      }, (err: any) => {
        this.doStartNativeListening(plugin);
      });
    } else {
      this.doStartNativeListening(plugin);
    }
  }

  doStartNativeListening(plugin: any) {
    try {
      plugin.startListening((matches: any) => {
        if (matches && matches.length) {
          this.handleTranscript(matches[0]);
        }
        this.nativeListening = false;
      }, (err: any) => {
        this.nativeListening = false;
        console.error('Native plugin error:', err);
      }, { language: 'it-IT', showPopup: false });
      this.nativeListening = true;
    } catch (e) {
      this.nativeListening = false;
      console.error('Exception in native listening:', e);
    }
  }

  stopNativeListening() {
    const w: any = window as any;
    const plugin = w.plugins && (w.plugins.speechRecognition || w.plugins.SpeechRecognition || w.plugins.speechrecognition);
    if (!plugin) return;
    try {
      if (plugin.stopListening) {
        plugin.stopListening(() => { this.nativeListening = false; }, (err: any) => { this.nativeListening = false; });
      } else {
        this.nativeListening = false;
      }
    } catch (e) {
      this.nativeListening = false;
    }
  }

  handleTranscript(text: string) {
    if (!text) return;
    
    // Parse the transcript with chrono-node
    const parsedData: any = {};
    let serviceText = text;
    
    try {
      const results: any[] = chrono.parse(text, new Date(), { forwardDate: true });
      
      if (results && results.length > 0) {
        const r = results[0];
        const dt = r.start && r.start.date ? r.start.date() : null;
        
        if (dt && !isNaN(dt.getTime())) {
          // Set date
          parsedData.data = dt.toISOString().split('T')[0];
          
          // Check if time is specified
          const hasTime = r.start.isCertain && (r.start.isCertain('hour') || r.start.isCertain('minute'));
          if (hasTime || (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
            const hh = dt.getHours().toString().padStart(2, '0');
            const mm = dt.getMinutes().toString().padStart(2, '0');
            parsedData.slot = `${hh}:${mm}`;
          }
          
          // Extract service by removing date/time phrases
          serviceText = text.toLowerCase()
            .replace(r.text.toLowerCase(), '')
            .replace(/\b(alle|per|alle ore|domani|oggi|dopodomani|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|mattina|pomeriggio|sera)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      
      // Try to extract operator name (look for "con [nome]")
      const operatorMatch = serviceText.match(/\b(con|da)\s+([a-zà-ù]+)\b/i);
      console.log('🔍 Operator match result:', operatorMatch);
      console.log('🔍 Operators available:', this.operators.length);
      
      if (operatorMatch && this.operators.length > 0) {
        const operatorName = operatorMatch[2].toLowerCase();
        console.log('🔍 Looking for operator name:', operatorName);
        console.log('🔍 Available operators:', this.operators.map(op => 
          `${op.userId.nome} (${op.userId.nome.toLowerCase()}) / ${op.userId.cognome} (${op.userId.cognome.toLowerCase()})`
        ));
        
        // Find operator by first name or last name (case insensitive)
        const foundOperator = this.operators.find(op => {
          const nomeMatch = op.userId.nome.toLowerCase() === operatorName;
          const cognomeMatch = op.userId.cognome.toLowerCase() === operatorName;
          console.log(`  Checking ${op.userId.nome} ${op.userId.cognome}: nome=${nomeMatch}, cognome=${cognomeMatch}`);
          return nomeMatch || cognomeMatch;
        });
        
        if (foundOperator) {
          parsedData.operatoreId = foundOperator._id;
          console.log('✅ Operator FOUND:', foundOperator.userId.nome, foundOperator.userId.cognome, 'ID:', foundOperator._id);
          // Remove operator phrase from service text
          serviceText = serviceText.replace(operatorMatch[0], '').trim();
        } else {
          console.log('❌ Operator NOT FOUND. Searched:', operatorName);
        }
      } else {
        console.log('❌ No operator pattern matched or no operators loaded');
      }
      
      // Clean up service text - remove prepositions at start/end
      serviceText = serviceText
        .replace(/^(per|di|da|a|in|con|e)\s+/i, '')
        .replace(/\s+(per|di|da|a|in|con|e)$/i, '')
        .trim();
      
      // Set service text if not empty
      if (serviceText) {
        parsedData.servizio = serviceText.charAt(0).toUpperCase() + serviceText.slice(1);
      }
    } catch (e) {
      console.error('Parsing error:', e);
      // Fallback: put everything in service
      parsedData.servizio = text;
    }
    
    // Navigate to booking page with parsed data
    const navigationExtras: NavigationExtras = {
      state: {
        voiceData: parsedData,
        transcript: text
      }
    };
    
    setTimeout(() => {
      this.router.navigate(['/booking'], navigationExtras);
    }, 500);
  }
}
