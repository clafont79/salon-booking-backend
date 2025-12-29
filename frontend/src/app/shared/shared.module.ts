import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NotificationBellComponent } from '../components/notification-bell/notification-bell.component';

@NgModule({
  declarations: [NotificationBellComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [NotificationBellComponent]
})
export class SharedModule {}
