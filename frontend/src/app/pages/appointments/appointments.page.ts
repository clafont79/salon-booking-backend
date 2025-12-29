import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.page.html',
  styleUrls: ['./appointments.page.scss'],
})
export class AppointmentsPage implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = false;
  filterType: 'all' | 'upcoming' | 'past' = 'upcoming';

  constructor(
    private appointmentService: AppointmentService,
    private alertController: AlertController,
    private router: Router
  ) {}
  
  goToHome() {
    this.router.navigate(['/home']);
  }
  
  goToBooking() {
    this.router.navigate(['/booking']);
  }
  
  openMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) {
      menu.open();
    }
  }

  ngOnInit() {
    this.loadAppointments();
  }

  ionViewWillEnter() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading = true;
    this.appointmentService.getAll().subscribe({
      next: (appointments: Appointment[]) => {
        this.appointments = appointments.sort((a, b) => 
          new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime()
        );
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const now = new Date();
    
    switch(this.filterType) {
      case 'upcoming':
        this.filteredAppointments = this.appointments.filter(
          apt => new Date(apt.dataOra) >= now && apt.stato !== 'cancellato'
        );
        break;
      case 'past':
        this.filteredAppointments = this.appointments.filter(
          apt => new Date(apt.dataOra) < now || apt.stato === 'completato'
        );
        break;
      default:
        this.filteredAppointments = this.appointments;
    }
  }

  onFilterChange(event: any) {
    this.filterType = event.detail.value;
    this.applyFilter();
  }

  async cancelAppointment(appointment: Appointment) {
    const alert = await this.alertController.create({
      header: 'Conferma Cancellazione',
      message: 'Sei sicuro di voler cancellare questo appuntamento?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Cancella',
          role: 'destructive',
          handler: () => {
            if (appointment._id) {
              this.appointmentService.delete(appointment._id).subscribe({
                next: () => {
                  this.loadAppointments();
                },
                error: async (error: any) => {
                  const errorAlert = await this.alertController.create({
                    header: 'Errore',
                    message: error.error?.message || 'Errore durante la cancellazione',
                    buttons: ['OK']
                  });
                  await errorAlert.present();
                }
              });
            }
          }
        }
      ]
    });

    await alert.present();
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

  getStatusColor(stato: string): string {
    switch(stato) {
      case 'confermato': return 'success';
      case 'completato': return 'medium';
      case 'cancellato': return 'danger';
      case 'in-attesa': return 'warning';
      default: return 'primary';
    }
  }

  getStatusClass(stato: string): string {
    switch(stato) {
      case 'confermato': return 'status-confirmed';
      case 'completato': return 'status-completed';
      case 'cancellato': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getEmptyMessage(): string {
    switch(this.filterType) {
      case 'upcoming': return 'Non hai appuntamenti futuri programmati';
      case 'past': return 'Non hai ancora completato nessun appuntamento';
      default: return 'Non hai ancora prenotato nessun servizio';
    }
  }
}
