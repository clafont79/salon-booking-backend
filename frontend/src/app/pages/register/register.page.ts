import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrazione in corso...'
    });
    await loading.present();

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigate(['/home']);
      },
      error: async (error: any) => {
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Errore',
          message: error.error?.message || 'Errore durante la registrazione',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async signUpWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Connessione con Google...'
    });
    await loading.present();

    try {
      const result = await GoogleAuth.signIn();
      
      if (result && result.authentication) {
        // Invia i dati al backend per creare l'utente
        const googleUser = {
          email: result.email,
          nome: result.givenName || result.name?.split(' ')[0] || '',
          cognome: result.familyName || result.name?.split(' ')[1] || '',
          telefono: '',
          googleId: result.id,
          photoUrl: result.imageUrl
        };

        this.authService.registerWithGoogle(googleUser).subscribe({
          next: () => {
            loading.dismiss();
            this.router.navigate(['/home']);
          },
          error: async (error: any) => {
            loading.dismiss();
            const alert = await this.alertController.create({
              header: 'Errore',
              message: error.error?.message || 'Errore durante la registrazione con Google',
              buttons: ['OK']
            });
            await alert.present();
          }
        });
      } else {
        loading.dismiss();
      }
    } catch (error) {
      loading.dismiss();
      const alert = await this.alertController.create({
        header: 'Errore',
        message: 'Impossibile connettersi con Google',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}
