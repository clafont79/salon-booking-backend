import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PaymentModalComponent } from './payment-modal/payment-modal.component';

@NgModule({
  declarations: [
    PaymentModalComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [
    PaymentModalComponent
  ]
})
export class SharedComponentsModule {}
