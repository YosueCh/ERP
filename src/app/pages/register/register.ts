import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    DatePickerModule,
    InputMaskModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  nombre          = '';
  email           = '';
  usuario         = '';
  password        = '';
  confirmPassword = '';
  direccion       = '';
  telefono        = '';
  fechaNacimiento: Date | null = null;
  loading         = false;

  
  readonly maxDate: Date = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
})();

// Fecha mínima permitida (90 años atrás desde hoy)
readonly minDate: Date = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 90);
  return date;
})();

  readonly PASSWORD_MIN_LENGTH = 10;
  readonly PASSWORD_SPECIAL_CHARS = '!@#$%^&*()-_=+';

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  private validatePassword(password: string): string | null {
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      return `La contraseña debe tener al menos ${this.PASSWORD_MIN_LENGTH} caracteres`;
    }
    const hasSpecial = /[!@#$%^&*()\-_=+]/.test(password);
    if (!hasSpecial) {
      return `Debe incluir al menos un símbolo: ${this.PASSWORD_SPECIAL_CHARS}`;
    }
    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
      return 'Debe incluir al menos una letra mayúscula';
    }
    const hasNumber = /[0-9]/.test(password);
    if (!hasNumber) {
      return 'Debe incluir al menos un número';
    }
    return null;
  }

  private validateAge(fechaNacimiento: Date): boolean {
    const today = new Date();
    const birth = new Date(fechaNacimiento);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  }

  private validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  }

  async onRegister(): Promise<void> {
    if (!this.nombre || !this.email || !this.usuario || !this.password || !this.telefono || !this.fechaNacimiento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Completa todos los campos obligatorios',
      });
      return;
    }

    if (!this.validatePhone(this.telefono)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Teléfono inválido',
        detail: 'El número de teléfono debe tener 10 dígitos',
      });
      return;
    }

    if (!this.validateAge(this.fechaNacimiento)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Edad no permitida',
        detail: 'Debes ser mayor de 18 años para registrarte',
      });
      return;
    }

    const passwordError = this.validatePassword(this.password);
    if (passwordError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Contraseña inválida',
        detail: passwordError,
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    this.loading = true;
    const result = await this.authService.register({
      nombre:           this.nombre,
      email:            this.email,
      usuario:          this.usuario,
      password:         this.password,
      confirmPassword:  this.confirmPassword,
      direccion:        this.direccion,
      telefono:         this.telefono.replace(/\D/g, ''),
      fecha_nacimiento: this.fechaNacimiento.toISOString().split('T')[0],
    });
    this.loading = false;

    if (result.success) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Tu cuenta fue creada. Inicia sesión.',
        life: 2500,
      });
      setTimeout(() => this.router.navigate(['/login']), 2500);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error ?? 'Error al registrar usuario',
      });
    }
  }
}