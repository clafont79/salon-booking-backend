import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  returnUrl: string = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    // Redirect se già loggato
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/home']);
      return;
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Accesso in corso...'
    });
    await loading.present();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        loading.dismiss();
        // Reindirizza in base al ruolo
        if (this.authService.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: async (error) => {
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Errore',
          message: error.error?.message || 'Credenziali non valide',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
