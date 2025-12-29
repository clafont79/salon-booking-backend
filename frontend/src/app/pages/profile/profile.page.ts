import { Component, OnInit } from '@angular/core';
import { UserService, UserProfile, UserStats } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userProfile: UserProfile = {
    _id: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: '',
    bio: '',
    dataNascita: undefined,
    indirizzo: {
      via: '',
      citta: '',
      cap: '',
      provincia: ''
    }!,
    preferenze: {
      notificheEmail: true,
      notificheSMS: true,
      linguaPreferita: 'it'
    }!,
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: ''
    }!,
    createdAt: new Date(),
    updatedAt: undefined
  };

  userStats: UserStats | null = null;
  isSaving = false;
  maxDate = new Date().toISOString();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadStats();
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = {
          ...profile,
          indirizzo: profile.indirizzo || {
            via: '',
            citta: '',
            cap: '',
            provincia: ''
          },
          preferenze: profile.preferenze || {
            notificheEmail: true,
            notificheSMS: true,
            linguaPreferita: 'it'
          },
          socialLinks: profile.socialLinks || {
            facebook: '',
            instagram: '',
            twitter: ''
          }
        };
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: 'Errore nel caricamento del profilo',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  loadStats() {
    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.userStats = stats;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle statistiche:', error);
      }
    });
  }

  async selectPhoto() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleziona Foto',
      buttons: [
        {
          text: 'Fotocamera',
          icon: 'camera',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Galleria',
          icon: 'images',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          }
        },
        {
          text: 'Annulla',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      if (image.dataUrl) {
        this.userService.uploadProfilePhoto(image.dataUrl).subscribe({
          next: async (response) => {
            this.userProfile.fotoProfilo = response.fotoProfilo;
            // Aggiorna anche AuthService per visualizzare subito la foto
            this.authService.updateCurrentUser({ fotoProfilo: response.fotoProfilo });
            const toast = await this.toastController.create({
              message: 'Foto profilo aggiornata con successo',
              duration: 2000,
              color: 'success'
            });
            toast.present();
          },
          error: async (error) => {
            const toast = await this.toastController.create({
              message: 'Errore nell\'aggiornamento della foto',
              duration: 3000,
              color: 'danger'
            });
            toast.present();
          }
        });
      }
    } catch (error) {
      console.error('Errore nella selezione della foto:', error);
    }
  }

  async saveProfile() {
    this.isSaving = true;

    const profileData: Partial<UserProfile> = {
      nome: this.userProfile.nome,
      cognome: this.userProfile.cognome,
      telefono: this.userProfile.telefono,
      bio: this.userProfile.bio,
      dataNascita: this.userProfile.dataNascita,
      indirizzo: this.userProfile.indirizzo,
      preferenze: this.userProfile.preferenze,
      socialLinks: this.userProfile.socialLinks
    };

    this.userService.updateProfile(profileData).subscribe({
      next: async (response) => {
        this.isSaving = false;
        // Aggiorna AuthService con i nuovi dati
        this.authService.updateCurrentUser({
          nome: response.nome,
          cognome: response.cognome,
          email: response.email,
          telefono: response.telefono,
          fotoProfilo: response.fotoProfilo
        });
        const toast = await this.toastController.create({
          message: 'Profilo aggiornato con successo',
          duration: 2000,
          color: 'success'
        });
        toast.present();
      },
      error: async (error) => {
        this.isSaving = false;
        const toast = await this.toastController.create({
          message: 'Errore nell\'aggiornamento del profilo',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambia Password',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Password Attuale'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nuova Password'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Conferma Nuova Password'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Cambia',
          handler: async (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              const toast = await this.toastController.create({
                message: 'Compila tutti i campi',
                duration: 2000,
                color: 'warning'
              });
              toast.present();
              return false;
            }

            if (data.newPassword !== data.confirmPassword) {
              const toast = await this.toastController.create({
                message: 'Le password non coincidono',
                duration: 2000,
                color: 'warning'
              });
              toast.present();
              return false;
            }

            if (data.newPassword.length < 6) {
              const toast = await this.toastController.create({
                message: 'La password deve essere di almeno 6 caratteri',
                duration: 2000,
                color: 'warning'
              });
              toast.present();
              return false;
            }

            this.userService.changePassword({
              currentPassword: data.currentPassword,
              newPassword: data.newPassword
            }).subscribe({
              next: async (response) => {
                const toast = await this.toastController.create({
                  message: 'Password modificata con successo',
                  duration: 2000,
                  color: 'success'
                });
                toast.present();
              },
              error: async (error) => {
                const toast = await this.toastController.create({
                  message: error.error?.message || 'Errore nel cambio password',
                  duration: 3000,
                  color: 'danger'
                });
                toast.present();
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Elimina Account',
      message: 'Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Inserisci la tua password per confermare'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async (data) => {
            if (!data.password) {
              const toast = await this.toastController.create({
                message: 'Inserisci la password per confermare',
                duration: 2000,
                color: 'warning'
              });
              toast.present();
              return false;
            }

            this.userService.deleteAccount(data.password).subscribe({
              next: async (response) => {
                const toast = await this.toastController.create({
                  message: 'Account eliminato con successo',
                  duration: 2000,
                  color: 'success'
                });
                toast.present();
                // TODO: Redirect to login page and clear session
              },
              error: async (error) => {
                const toast = await this.toastController.create({
                  message: error.error?.message || 'Errore nell\'eliminazione dell\'account',
                  duration: 3000,
                  color: 'danger'
                });
                toast.present();
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  getRoleLabel(role: string | undefined): string {
    switch(role) {
      case 'admin': return 'Amministratore';
      case 'operatore': return 'Operatore';
      case 'cliente': return 'Cliente';
      default: return 'Utente';
    }
  }
}

