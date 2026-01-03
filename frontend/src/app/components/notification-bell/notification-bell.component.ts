import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  showPopover = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private popoverController: PopoverController,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.notification-bell-wrapper');
    if (!clickedInside && this.showPopover) {
      this.closePopover();
    }
  }

  ngOnInit() {
    // Sottoscrivi al contatore
    const countSub = this.notificationService.unreadCount$.subscribe(
      count => this.unreadCount = count
    );
    
    // Sottoscrivi alle notifiche
    const notifSub = this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications.slice(0, 10)
    );

    this.subscriptions.push(countSub, notifSub);

    // Avvia polling
    this.notificationService.startPolling();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationService.stopPolling();
  }

  togglePopover(event: Event) {
    event.stopPropagation();
    this.showPopover = !this.showPopover;
  }

  closePopover() {
    this.showPopover = false;
  }

  onNotificationClick(notification: Notification) {
    // Marca come letta
    if (!notification.letto) {
      this.notificationService.markAsRead(notification._id).subscribe();
    }

    // Naviga all'appuntamento se presente
    if (notification.appuntamentoId) {
      this.router.navigate(['/appointments']);
    }

    this.closePopover();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.closePopover();
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification._id).subscribe();
  }

  deleteAllRead() {
    this.notificationService.deleteAllRead().subscribe(() => {
      this.closePopover();
    });
  }

  formatTime(date: Date): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return notifDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  getNotificationIcon(tipo: string): string {
    switch(tipo) {
      case 'promemoria_24h': return 'calendar-outline';
      case 'promemoria_1h': return 'alarm-outline';
      case 'appuntamento_confermato': return 'checkmark-circle-outline';
      case 'appuntamento_cancellato': return 'close-circle-outline';
      default: return 'notifications-outline';
    }
  }
}
