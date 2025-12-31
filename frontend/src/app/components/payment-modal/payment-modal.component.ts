import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
})
export class PaymentModalComponent implements OnInit {
  @Input() amount!: number;
  @Input() appointmentId!: string;
  
  selectedMethod: string = '';

  constructor(
    private modalController: ModalController,
    private paymentService: PaymentService,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  selectMethod(method: string) {
    this.selectedMethod = method;
    
    // Inizializza i pulsanti di pagamento quando viene selezionato il metodo
    setTimeout(() => {
      if (method === 'paypal') {
        this.initPayPal();
      } else if (method === 'google-pay') {
        this.initGooglePay();
      }
    }, 100);
  }

  initPayPal() {
    this.paymentService.initPayPalButton(
      'paypal-button-container',
      this.amount,
      (details) => this.onPaymentSuccess('paypal', details),
      (error) => this.onPaymentError(error)
    );
  }

  initGooglePay() {
    this.paymentService.initGooglePayButton(
      'google-pay-button-container',
      this.amount,
      (paymentData) => this.onPaymentSuccess('google-pay', paymentData),
      (error) => this.onPaymentError(error)
    );
  }

  async onPaymentSuccess(method: string, details: any) {
    // Conferma il pagamento sul backend
    this.paymentService.confirmPayment(this.appointmentId, {
      method,
      details
    }).subscribe({
      next: async () => {
        const alert = await this.alertController.create({
          header: 'Pagamento Confermato',
          message: 'Il tuo pagamento è stato completato con successo!',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.dismiss({ success: true, method, paid: true });
            }
          }]
        });
        await alert.present();
      },
      error: async (error) => {
        const alert = await this.alertController.create({
          header: 'Errore',
          message: 'Si è verificato un errore durante la conferma del pagamento',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async onPaymentError(error: any) {
    const alert = await this.alertController.create({
      header: 'Errore Pagamento',
      message: 'Si è verificato un errore durante il pagamento. Riprova.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async confirmCardPayment() {
    this.dismiss({ success: true, method: 'card', paid: false });
  }

  async confirmCashPayment() {
    this.dismiss({ success: true, method: 'cash', paid: false });
  }

  dismiss(data?: any) {
    this.modalController.dismiss(data);
  }
}
