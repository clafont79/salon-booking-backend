import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  showSplash = true;

  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'I Miei Appuntamenti', url: '/appointments', icon: 'calendar' },
    { title: 'Prenota', url: '/booking', icon: 'add-circle' },
    { title: 'Profilo', url: '/profile', icon: 'person' },
  ];

  public adminPages = [
    { title: 'Gestione Admin', url: '/admin', icon: 'settings' },
    { title: 'Profilo', url: '/profile', icon: 'person' },
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Nascondi splash screen dopo 2.5 secondi
    setTimeout(() => {
      this.showSplash = false;
    }, 2500);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
