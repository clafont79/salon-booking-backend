import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare const paypal: any;
declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Inizializza PayPal button
   */
  initPayPalButton(containerId: string, amount: number, onSuccess: (details: any) => void, onError?: (error: any) => void): void {
    if (typeof paypal === 'undefined') {
      console.error('PayPal SDK non caricato');
      if (onError) onError({ message: 'PayPal SDK non disponibile' });
      return;
    }

    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        const order = await actions.order.capture();
        onSuccess(order);
      },
      onError: (err: any) => {
        console.error('Errore PayPal:', err);
        if (onError) onError(err);
      }
    }).render(`#${containerId}`);
  }

  /**
   * Inizializza Google Pay button
   */
  initGooglePayButton(
    containerId: string,
    amount: number,
    onSuccess: (paymentData: any) => void,
    onError?: (error: any) => void
  ): void {
    if (typeof google === 'undefined' || !google.payments) {
      console.error('Google Pay API non caricata');
      if (onError) onError({ message: 'Google Pay non disponibile' });
      return;
    }

    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST' // Cambia a 'PRODUCTION' per produzione
    });

    const button = paymentsClient.createButton({
      onClick: () => this.onGooglePayButtonClicked(paymentsClient, amount, onSuccess, onError)
    });

    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(button);
    }
  }

  private async onGooglePayButtonClicked(
    paymentsClient: any,
    amount: number,
    onSuccess: (paymentData: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    const paymentDataRequest = this.getGooglePaymentDataRequest(amount);

    try {
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      onSuccess(paymentData);
    } catch (err) {
      console.error('Errore Google Pay:', err);
      if (onError) onError(err);
    }
  }

  private getGooglePaymentDataRequest(amount: number): any {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example', // Sostituisci con il tuo gateway
            gatewayMerchantId: 'exampleMerchantId' // Sostituisci con il tuo merchant ID
          }
        }
      }],
      merchantInfo: {
        merchantId: '12345678901234567890', // Sostituisci con il tuo merchant ID
        merchantName: 'hairIT Salon Booking'
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount.toFixed(2),
        currencyCode: 'EUR'
      }
    };
  }

  /**
   * Conferma pagamento sul backend
   */
  confirmPayment(appointmentId: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/confirm`, {
      appointmentId,
      paymentData
    });
  }

  /**
   * Ottieni lo stato di un pagamento
   */
  getPaymentStatus(appointmentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/status/${appointmentId}`);
  }
}
