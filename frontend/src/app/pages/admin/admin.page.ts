import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, LoadingController, ToastController, IonItemSliding } from '@ionic/angular';
import { OperatorService } from '../../services/operator.service';
import { AppointmentService } from '../../services/appointment.service';
import { Operator } from '../../models/operator.model';
import { Appointment } from '../../models/appointment.model';
import { OperatorModalComponent } from './operator-modal/operator-modal.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  selectedTab: string = 'operators';
  operators: Operator[] = [];
  groupedOperators: Map<string, Operator[]> = new Map();
  groupedOperatorsArray: Array<{user: any, operators: Operator[]}> = [];
  loading = false;
  currentOpenSliding: IonItemSliding | null = null;
  currentOpenOperatorId: string | null = null;
  
  // Gestione Appuntamenti
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loadingAppointments = false;
  selectedStatusFilter: string = 'all';
  selectedDateFilter: string = 'all';
  searchTerm: string = '';
  
  // Configurazioni
  slotDuration = 30; // minuti
  openingTime = '09:00';
  closingTime = '18:00';
  workingDays = {
    lunedi: true,
    martedi: true,
    mercoledi: true,
    giovedi: true,
    venerdi: true,
    sabato: false,
    domenica: false
  };

  constructor(
    private router: Router,
    private operatorService: OperatorService,
    private appointmentService: AppointmentService,
    private alertController: AlertController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadOperators();
    this.loadAppointments();
  }

  onSegmentChange(event: any) {
    this.selectedTab = event.detail.value;
    if (this.selectedTab === 'appointments' && this.appointments.length === 0) {
      this.loadAppointments();
    }
  }
  
  async openOperatorOptions(operatorId: string, slidingItem: IonItemSliding, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Piccolo delay per permettere al componente di aggiornare il suo stato
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Controlla se è già aperto
    const ratio = await slidingItem.getSlidingRatio();
    
    // Se è lo stesso operatore e il menu è aperto (ratio > 0), chiudilo
    if (this.currentOpenOperatorId === operatorId && Math.abs(ratio) > 0) {
      await slidingItem.close();
      this.currentOpenSliding = null;
      this.currentOpenOperatorId = null;
      return;
    }
    
    // Se c'è un altro item aperto, chiudilo prima
    if (this.currentOpenSliding && this.currentOpenOperatorId !== operatorId) {
      await this.currentOpenSliding.close();
    }
    
    // Apri il nuovo item
    await slidingItem.open('end');
    this.currentOpenSliding = slidingItem;
    this.currentOpenOperatorId = operatorId;
  }
  
  loadOperators() {
    this.loading = true;
    this.operatorService.getAll().subscribe({
      next: (operators) => {
        this.operators = operators;
        this.groupOperators();
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore caricamento operatori:', error);
        this.loading = false;
        this.showToast('Errore nel caricamento degli operatori', 'danger');
      }
    });
  }

  groupOperators() {
    this.groupedOperators.clear();
    this.operators.forEach(operator => {
      const userId = typeof operator.userId === 'string' ? operator.userId : operator.userId._id;
      if (!this.groupedOperators.has(userId)) {
        this.groupedOperators.set(userId, []);
      }
      this.groupedOperators.get(userId)!.push(operator);
    });
    
    // Aggiorna l'array per il template
    this.groupedOperatorsArray = Array.from(this.groupedOperators.entries()).map(([userId, operators]) => ({
      user: operators[0].userId,
      operators: operators
    }));
  }
  
  async addOperator() {
    const modal = await this.modalController.create({
      component: OperatorModalComponent,
      componentProps: {
        existingOperators: this.operators
      }
    });
    
    await modal.present();
    
    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'created' && data) {
      this.showToast('Operatore creato con successo', 'success');
      this.loadOperators();
    }
  }
  
  async viewOperator(operator: Operator) {
    const modal = await this.modalController.create({
      component: OperatorModalComponent,
      componentProps: {
        operator,
        viewOnly: true,
        existingOperators: this.operators
      }
    });
    
    await modal.present();
  }
  
  async editOperator(operator: Operator) {
    const modal = await this.modalController.create({
      component: OperatorModalComponent,
      componentProps: {
        operator,
        existingOperators: this.operators
      }
    });
    
    await modal.present();
    
    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'updated' && data) {
      this.showToast('Operatore aggiornato con successo', 'success');
      this.loadOperators();
    }
  }
  
  async deleteOperator(operator: Operator) {
    const alert = await this.alertController.create({
      header: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare ${operator.userId.nome} ${operator.userId.cognome}?`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminazione in corso...'
            });
            await loading.present();
            
            this.operatorService.delete(operator._id!).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Operatore eliminato con successo', 'success');
                this.loadOperators();
              },
              error: (error) => {
                loading.dismiss();
                this.showToast('Errore durante l\'eliminazione', 'danger');
                console.error(error);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
  
  async saveSlotDuration() {
    // Salva la configurazione dello slot
    this.showToast(`Intervallo impostato a ${this.slotDuration} minuti`, 'success');
  }
  
  async saveBusinessHours() {
    // Salva gli orari di apertura/chiusura
    this.showToast(`Orari salvati: ${this.openingTime} - ${this.closingTime}`, 'success');
  }
  
  async saveWorkingDays() {
    // Salva i giorni lavorativi
    const activeDays = Object.entries(this.workingDays)
      .filter(([_, active]) => active)
      .map(([day, _]) => day)
      .join(', ');
    this.showToast(`Giorni lavorativi aggiornati: ${activeDays}`, 'success');
  }
  
  // ===== GESTIONE APPUNTAMENTI =====
  
  loadAppointments() {
    this.loadingAppointments = true;
    this.appointmentService.getAll().subscribe({
      next: (appointments) => {
        this.appointments = appointments.sort((a, b) => 
          new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime()
        );
        this.filterAppointments();
        this.loadingAppointments = false;
      },
      error: (error) => {
        console.error('Errore caricamento appuntamenti:', error);
        this.loadingAppointments = false;
        this.showToast('Errore nel caricamento degli appuntamenti', 'danger');
      }
    });
  }
  
  filterAppointments() {
    let filtered = [...this.appointments];
    
    // Filtro per stato
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.stato === this.selectedStatusFilter);
    }
    
    // Filtro per data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    if (this.selectedDateFilter === 'today') {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.dataOra);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (this.selectedDateFilter === 'week') {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.dataOra);
        return aptDate >= today && aptDate < nextWeek;
      });
    } else if (this.selectedDateFilter === 'past') {
      filtered = filtered.filter(apt => new Date(apt.dataOra) < today);
    } else if (this.selectedDateFilter === 'future') {
      filtered = filtered.filter(apt => new Date(apt.dataOra) >= today);
    }
    
    // Filtro per ricerca
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.clienteId.nome.toLowerCase().includes(term) ||
        apt.clienteId.cognome.toLowerCase().includes(term) ||
        apt.servizio.toLowerCase().includes(term) ||
        apt.operatoreId.userId.nome.toLowerCase().includes(term) ||
        apt.operatoreId.userId.cognome.toLowerCase().includes(term)
      );
    }
    
    this.filteredAppointments = filtered;
  }
  
  onStatusFilterChange(event: any) {
    this.selectedStatusFilter = event.detail.value;
    this.filterAppointments();
  }
  
  onDateFilterChange(event: any) {
    this.selectedDateFilter = event.detail.value;
    this.filterAppointments();
  }
  
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterAppointments();
  }
  
  async changeAppointmentStatus(appointment: Appointment, newStatus: string) {
    const statusLabels: any = {
      'confermato': 'Confermato',
      'completato': 'Completato',
      'cancellato': 'Cancellato',
      'in-attesa': 'In Attesa'
    };
    
    const alert = await this.alertController.create({
      header: 'Cambia Stato',
      message: `Vuoi cambiare lo stato dell'appuntamento in "${statusLabels[newStatus]}"?`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Conferma',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Aggiornamento in corso...'
            });
            await loading.present();
            
            this.appointmentService.updateStatus(appointment._id!, newStatus as any).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Stato appuntamento aggiornato', 'success');
                this.loadAppointments();
              },
              error: (error) => {
                loading.dismiss();
                this.showToast('Errore durante l\'aggiornamento', 'danger');
                console.error(error);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
  
  async deleteAppointment(appointment: Appointment) {
    const alert = await this.alertController.create({
      header: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare questo appuntamento?`,
      subHeader: `Cliente: ${appointment.clienteId.nome} ${appointment.clienteId.cognome}`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminazione in corso...'
            });
            await loading.present();
            
            this.appointmentService.delete(appointment._id!).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Appuntamento eliminato', 'success');
                this.loadAppointments();
              },
              error: (error) => {
                loading.dismiss();
                this.showToast('Errore durante l\'eliminazione', 'danger');
                console.error(error);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
  
  getStatusColor(status: string): string {
    const colors: any = {
      'confermato': 'primary',
      'completato': 'success',
      'cancellato': 'danger',
      'in-attesa': 'warning'
    };
    return colors[status] || 'medium';
  }
  
  getStatusLabel(status: string): string {
    const labels: any = {
      'confermato': 'Confermato',
      'completato': 'Completato',
      'cancellato': 'Cancellato',
      'in-attesa': 'In Attesa'
    };
    return labels[status] || status;
  }
  
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
  
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
