import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface Notification {
  _id: string;
  userId: string;
  tipo: 'appuntamento_imminente' | 'appuntamento_confermato' | 'appuntamento_cancellato' | 'promemoria_24h' | 'promemoria_1h' | 'altro';
  titolo: string;
  messaggio: string;
  appuntamentoId?: {
    _id: string;
    servizio: string;
    dataOra: Date;
  };
  letto: boolean;
  dataInvio: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private pollingSubscription: any;

  constructor(private http: HttpClient) {}

  // Avvia polling automatico ogni 30 secondi
  startPolling() {
    if (this.pollingSubscription) {
      return; // Già in polling
    }

    // Carica immediatamente
    this.loadNotifications();
    this.loadUnreadCount();

    // Poi ogni 30 secondi
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
      this.loadUnreadCount();
    });
  }

  // Ferma polling
  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Carica tutte le notifiche
  loadNotifications(letto?: boolean, limit: number = 50) {
    let url = `${this.apiUrl}?limit=${limit}`;
    if (letto !== undefined) {
      url += `&letto=${letto}`;
    }

    this.http.get<Notification[]>(url).pipe(
      tap(notifications => this.notificationsSubject.next(notifications)),
      catchError(error => {
        console.error('Error loading notifications:', error);
        return [];
      })
    ).subscribe();
  }

  // Carica conteggio notifiche non lette
  loadUnreadCount() {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count)),
      catchError(error => {
        console.error('Error loading unread count:', error);
        return [];
      })
    ).subscribe();
  }

  // Ottieni notifiche (per uso diretto)
  getNotifications(letto?: boolean, limit: number = 50): Observable<Notification[]> {
    let url = `${this.apiUrl}?limit=${limit}`;
    if (letto !== undefined) {
      url += `&letto=${letto}`;
    }
    return this.http.get<Notification[]>(url);
  }

  // Ottieni conteggio non lette (per uso diretto)
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  // Marca una notifica come letta
  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      })
    );
  }

  // Marca tutte come lette
  markAllAsRead(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      })
    );
  }

  // Elimina una notifica
  deleteNotification(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      })
    );
  }

  // Elimina tutte le notifiche lette
  deleteAllRead(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/read`).pipe(
      tap(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      })
    );
  }

  // Ottieni valore corrente contatore
  get currentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // Ottieni valore corrente notifiche
  get currentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }
}
