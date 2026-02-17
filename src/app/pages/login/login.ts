import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';

import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    AvatarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  isLoading = false;
  loginError = '';
  emailError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    this.loginError = '';
    this.emailError = '';
    this.passwordError = '';

    if (!this.credentials.email) {
      this.emailError = 'El correo es requerido';
      return;
    }
    if (!this.credentials.password) {
      this.passwordError = 'La contraseña es requerida';
      return;
    }

    this.isLoading = true;
    try {
      const success = await this.authService.login(
        this.credentials.email,
        this.credentials.password
      );

      if (success) {
        this.router.navigate(['/home']);
      } else {
        this.loginError = 'Credenciales inválidas. Intenta de nuevo.';
      }
    } catch {
      this.loginError = 'Error al iniciar sesión. Intenta más tarde.';
    } finally {
      this.isLoading = false;
    }
  }
}