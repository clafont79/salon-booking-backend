import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PlacesService } from '../../services/places.service';
import { OperatorService } from '../../services/operator.service';
import { AppointmentService } from '../../services/appointment.service';
import { Place } from '../../models/place.model';
import { Operator } from '../../models/operator.model';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

interface BookingStep {
  number: number;
  title: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-booking-wizard',
  templateUrl: './booking-wizard.page.html',
  styleUrls: ['./booking-wizard.page.scss'],
})
export class BookingWizardPage implements OnInit {
  currentStep: number = 1;
  totalSteps: number = 5;
  
  steps: BookingStep[] = [
    { number: 1, title: 'Salone', subtitle: 'Scegli il tuo salone', icon: 'storefront' },
    { number: 2, title: 'Servizio', subtitle: 'Cosa desideri fare?', icon: 'cut' },
    { number: 3, title: 'Operatore', subtitle: 'Scegli il tuo stylist', icon: 'person' },
    { number: 4, title: 'Quando', subtitle: 'Data e orario', icon: 'calendar' },
    { number: 5, title: 'Conferma', subtitle: 'Riepilogo prenotazione', icon: 'checkmark-circle' }
  ];

  // Dati selezione
  selectedSalon: Place | null = null;
  selectedService: string = '';
  selectedOperator: Operator | null = null;
  selectedDate: string = '';
  selectedSlot: string = '';
  notes: string = '';

  // Dati disponibili
  salons: Place[] = [];
  services: string[] = [
    'Taglio Donna',
    'Taglio Uomo',
    'Piega',
    'Colore',
    'Meches/Colpi di Sole',
    'Trattamenti',
    'Barba',
    'Styling'
  ];
  operators: Operator[] = [];
  availableDates: string[] = [];
  availableSlots: string[] = [];

  loading: boolean = false;
  minDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private operatorService: OperatorService,
    private appointmentService: AppointmentService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Check se c'è un salon pre-selezionato dalla mappa
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state && navigation.extras.state['preselectedSalonId']) {
      const salonId = navigation.extras.state['preselectedSalonId'];
      this.loadSalonById(salonId);
    } else {
      this.loadSalons();
    }
  }

  async loadSalonById(salonId: string) {
    this.loading = true;
    this.placesService.getPlaceById(salonId).subscribe({
      next: (salon) => {
        if (salon) {
          this.selectedSalon = salon;
          this.currentStep = 2; // Vai direttamente allo step servizi
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Errore caricamento salone');
      }
    });
  }

  async loadSalons() {
    this.loading = true;
    try {
      // Posizione Milano per default
      this.placesService.getNearbyPlaces(45.4642, 9.1900, 50).subscribe({
        next: (salons) => {
          this.salons = salons;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.showToast('Errore caricamento saloni');
        }
      });
    } catch (error) {
      this.loading = false;
    }
  }

  loadOperators() {
    if (!this.selectedSalon) return;
    
    this.loading = true;
    this.operatorService.getActive().subscribe({
      next: (operators: Operator[]) => {
        this.operators = operators;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Errore caricamento operatori');
      }
    });
  }

  selectSalon(salon: Place) {
    this.selectedSalon = salon;
    this.nextStep();
  }

  selectService(service: string) {
    this.selectedService = service;
    this.loadOperators();
    this.nextStep();
  }

  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.generateAvailableSlots();
    this.nextStep();
  }

  selectDate(date: string) {
    this.selectedDate = date;
    this.generateAvailableSlots();
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  generateAvailableSlots() {
    if (!this.selectedDate) return;
    
    // Genera slot dalle 9:00 alle 19:00 ogni 30 minuti
    const slots: string[] = [];
    for (let hour = 9; hour <= 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 19) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    this.availableSlots = slots;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return !!this.selectedSalon;
      case 2: return !!this.selectedService;
      case 3: return !!this.selectedOperator;
      case 4: return !!this.selectedDate && !!this.selectedSlot;
      case 5: return true;
      default: return false;
    }
  }

  async confirmBooking() {
    if (!this.selectedSalon || !this.selectedService || !this.selectedOperator || 
        !this.selectedDate || !this.selectedSlot) {
      this.showToast('Completa tutti i campi obbligatori');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creazione prenotazione...'
    });
    await loading.present();

    const bookingData = {
      operatoreId: this.selectedOperator._id!,
      dataOra: `${this.selectedDate}T${this.selectedSlot}:00`,
      servizio: this.selectedService,
      note: this.notes || '',
      durata: 30
    };

    this.appointmentService.create(bookingData).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showSuccessAlert();
        this.router.navigate(['/appointments']);
      },
      error: async (error: any) => {
        await loading.dismiss();
        this.showToast('Errore durante la prenotazione');
        console.error('Booking error:', error);
      }
    });
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Prenotazione Confermata! ✅',
      message: `La tua prenotazione presso ${this.selectedSalon?.nome} è stata confermata per ${this.selectedDate} alle ${this.selectedSlot}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  getServiceIcon(service: string): string {
    const iconMap: { [key: string]: string } = {
      'Taglio Donna': 'woman',
      'Taglio Uomo': 'man',
      'Piega': 'color-wand',
      'Colore': 'water',
      'Meches/Colpi di Sole': 'sunny',
      'Trattamenti': 'heart',
      'Barba': 'cut',
      'Styling': 'star'
    };
    return iconMap[service] || 'cut';
  }

  goBack() {
    this.router.navigate(['/places']);
  }
}
