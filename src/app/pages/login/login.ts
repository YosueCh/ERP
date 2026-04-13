import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  email    = '';
  password = '';
  loading  = false;

  private logoClickCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    // Detectar si fue redirigido por cuenta desactivada mid-session
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'deactivated') {
      setTimeout(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sesión cerrada',
          detail: 'Tu cuenta fue desactivada. Contacta al administrador.',
          life: 6000,
        });
      }, 300);
    }
  }

  onLogoClick(): void {
  this.logoClickCount++;
  if (this.logoClickCount >= 5) {
    this.logoClickCount = 0;
    this.messageService.add({
      severity: 'info',
      summary: 'catch u',
      detail: 'Sabemos que estás ahí...',
      life: 4000,
    });
  }
}

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Ingresa tu email y contraseña',
      });
      return;
    }

    this.loading = true;
    const result = await this.authService.login(this.email, this.password);
    this.loading = false;

    if (result.success) {
      this.router.navigate(['/home']);
    } else if (result.error === 'INACTIVE') {
      this.messageService.add({
        severity: 'error',
        summary: 'Cuenta desactivada',
        detail: 'Tu cuenta está desactivada. Contacta al administrador.',
        life: 6000,
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error ?? 'Credenciales inválidas',
      });
    }
  }
}