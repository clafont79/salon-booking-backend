import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OperatorService } from '../../../services/operator.service';
import { Operator } from '../../../models/operator.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-operator-modal',
  templateUrl: './operator-modal.component.html',
  styleUrls: ['./operator-modal.component.scss'],
})
export class OperatorModalComponent implements OnInit {
  @Input() operator?: Operator;
  @Input() viewOnly: boolean = false;
  @Input() existingOperators: Operator[] = [];
  operatorForm!: FormGroup;
  users: any[] = [];
  loading = false;
  customSpecializzazione = '';
  selectedSpecializzazioni: string[] = [];
  hasCustomSpecializzazione = false;
  disponibilita: any[] = [];
  
  specializzazioni = [
    'Parrucchiere/a',
    'Estetista',
    'Barbiere',
    'Massaggiatore/trice',
    'Manicure/Pedicure',
    'Truccatore/trice',
    'Tatuatore/trice',
    'Altro...'
  ];
  
  colori = [
    { nome: 'Viola', valore: '#667eea' },
    { nome: 'Rosa', valore: '#f093fb' },
    { nome: 'Blu', valore: '#4facfe' },
    { nome: 'Verde', valore: '#43e97b' },
    { nome: 'Arancione', valore: '#fa709a' },
    { nome: 'Rosso', valore: '#ff6b6b' },
    { nome: 'Turchese', valore: '#30cfd0' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private operatorService: OperatorService,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadUsers();
    this.loadSpecializzazioni();
    this.initDisponibilita();
  }

  initForm() {
    this.operatorForm = this.fb.group({
      userId: [this.operator?.userId._id || '', Validators.required],
      specializzazioni: [this.operator?.specializzazioni || [], Validators.required],
      descrizione: [this.operator?.descrizione || ''],
      colore: [this.operator?.colore || '#667eea', Validators.required],
      attivo: [this.operator?.attivo !== false]
    });
    
    // Se modalità visualizzazione, disabilita tutto il form
    if (this.viewOnly) {
      this.operatorForm.disable();
    }
    
    // Ascolta i cambiamenti delle specializzazioni
    this.operatorForm.get('specializzazioni')?.valueChanges.subscribe(value => {
      this.selectedSpecializzazioni = value || [];
      this.hasCustomSpecializzazione = value && value.includes('Altro...');
    });
    
    // Inizializza specializzazioni selezionate
    if (this.operator?.specializzazioni) {
      this.selectedSpecializzazioni = this.operator.specializzazioni;
    }
  }
  
  loadSpecializzazioni() {
    // Carica specializzazioni esistenti dal backend
    this.operatorService.getAll().subscribe({
      next: (operators) => {
        operators.forEach(op => {
          if (op.specializzazioni && op.specializzazioni.length > 0) {
            op.specializzazioni.forEach(spec => {
              if (spec && 
                  !this.specializzazioni.includes(spec) &&
                  spec !== 'Altro...') {
                this.specializzazioni.splice(this.specializzazioni.length - 1, 0, spec);
              }
            });
          }
        });
        // Rimuovi duplicati
        this.specializzazioni = [...new Set(this.specializzazioni)];
      },
      error: (error) => {
        console.error('Errore caricamento specializzazioni:', error);
      }
    });
  }

  loadUsers() {
    this.loading = true;
    // Carica tutti gli utenti per selezionare quale associare come operatore
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (users) => {
        // Filtra solo utenti attivi con ruolo 'operatore'
        let filteredUsers = users.filter(u => u.attivo && u.ruolo === 'operatore');
        
        // Escludi gli utenti già assegnati come operatori (tranne quello in modifica)
        if (this.existingOperators && this.existingOperators.length > 0) {
          const existingUserIds = this.existingOperators
            .filter(op => !this.operator || op._id !== this.operator._id)
            .map(op => op.userId._id);
          
          filteredUsers = filteredUsers.filter(u => !existingUserIds.includes(u._id));
        }
        
        this.users = filteredUsers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore caricamento utenti:', error);
        this.loading = false;
      }
    });
  }

  async save() {
    if (this.operatorForm.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Errore',
        message: 'Compila tutti i campi obbligatori',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const formData = this.operatorForm.value;
    
    // Rimuovi "Altro..." dalla lista se presente
    if (formData.specializzazioni) {
      formData.specializzazioni = formData.specializzazioni.filter((s: string) => s !== 'Altro...');
    }
    
    // Aggiungi disponibilità ai dati del form
    // Espandi i giorni multipli in slot singoli per il backend
    const disponibilitaExpanded: any[] = [];
    this.disponibilita.forEach(slot => {
      if (slot.giorni && slot.giorni.length > 0) {
        slot.giorni.forEach((giorno: string) => {
          disponibilitaExpanded.push({
            giornoSettimana: giorno,
            oraInizio: slot.oraInizio,
            oraFine: slot.oraFine,
            pausaPranzo: slot.pausaPranzo,
            inizioPausa: slot.pausaPranzo ? slot.inizioPausa : undefined,
            finePausa: slot.pausaPranzo ? slot.finePausa : undefined
          });
        });
      }
    });
    
    formData.disponibilita = disponibilitaExpanded;
    
    this.loading = true;
    
    if (this.operator?._id) {
      // Modifica operatore esistente
      this.operatorService.update(this.operator._id, formData).subscribe({
        next: (result) => {
          this.loading = false;
          this.modalCtrl.dismiss(result, 'updated');
        },
        error: (error) => {
          console.error('Errore aggiornamento operatore:', error);
          this.loading = false;
          this.showError('Errore durante l\'aggiornamento dell\'operatore');
        }
      });
    } else {
      // Crea nuovo operatore
      this.operatorService.create(formData).subscribe({
        next: (result) => {
          this.loading = false;
          this.modalCtrl.dismiss(result, 'created');
        },
        error: (error) => {
          console.error('Errore creazione operatore:', error);
          this.loading = false;
          this.showError('Errore durante la creazione dell\'operatore');
        }
      });
    }
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Errore',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  switchToEditMode() {
    this.viewOnly = false;
    this.operatorForm.enable();
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  getUserLabel(user: any): string {
    return `${user.nome} ${user.cognome} (${user.email})`;
  }

  addCustomSpecializzazione() {
    if (this.customSpecializzazione.trim()) {
      const currentSpecs = this.operatorForm.get('specializzazioni')?.value || [];
      // Rimuovi "Altro..." se presente
      const filtered = currentSpecs.filter((s: string) => s !== 'Altro...');
      // Aggiungi la specializzazione custom
      filtered.push(this.customSpecializzazione.trim());
      this.operatorForm.patchValue({ specializzazioni: filtered });
      this.customSpecializzazione = '';
    }
  }

  initDisponibilita() {
    if (this.operator?.disponibilita && this.operator.disponibilita.length > 0) {
      // Raggruppa disponibilità per orari identici
      const groupedSlots = new Map<string, string[]>();
      
      this.operator.disponibilita.forEach(slot => {
        const key = `${slot.oraInizio}|${slot.oraFine}|${slot.pausaPranzo}|${slot.inizioPausa}|${slot.finePausa}`;
        if (!groupedSlots.has(key)) {
          groupedSlots.set(key, []);
        }
        groupedSlots.get(key)!.push(slot.giornoSettimana);
      });
      
      // Crea slot raggruppati
      this.disponibilita = Array.from(groupedSlots.entries()).map(([key, giorni]) => {
        const [oraInizio, oraFine, pausaPranzo, inizioPausa, finePausa] = key.split('|');
        return {
          giorni: giorni,
          oraInizio: oraInizio,
          oraFine: oraFine,
          pausaPranzo: pausaPranzo === 'true',
          inizioPausa: inizioPausa || '12:00',
          finePausa: finePausa || '13:00'
        };
      });
    } else {
      // Nessuna disponibilità, inizia con array vuoto
      this.disponibilita = [];
    }
  }

  addSlot() {
    this.disponibilita.push({
      giorni: [],
      oraInizio: '09:00',
      oraFine: '18:00',
      pausaPranzo: false,
      inizioPausa: '12:00',
      finePausa: '13:00'
    });
  }

  removeSlot(index: number) {
    this.disponibilita.splice(index, 1);
  }
  
  formatSelectedDays(giorni: string[]): string {
    const dayLabels: { [key: string]: string } = {
      'lunedi': 'Lun',
      'martedi': 'Mar',
      'mercoledi': 'Mer',
      'giovedi': 'Gio',
      'venerdi': 'Ven',
      'sabato': 'Sab',
      'domenica': 'Dom'
    };
    return giorni.map(g => dayLabels[g] || g).join(', ');
  }
}
