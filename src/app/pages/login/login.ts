import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth';
import { RouterLink } from '@angular/router';

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
export class LoginComponent {
  email    = '';
  password = '';
  loading  = false;

  // Easter egg: 5 clicks en logo
  private logoClickCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  onLogoClick(): void {
    this.logoClickCount++;
    if (this.logoClickCount >= 5) {
      this.logoClickCount = 0;
      alert('catch u');
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
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error ?? 'Credenciales inválidas',
      });
    }
  }
}