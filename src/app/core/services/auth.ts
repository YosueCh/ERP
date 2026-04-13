import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { PermissionsService } from './permissions';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  usuario: string;
  direccion: string;
}

interface LoginResponse {
  statusCode: number;
  intOpCode: string;
  data: {
    token: string;
    user: {
      id: string;
      nombre: string;
      email: string;
      usuario: string;
      direccion: string;
    };
    permissionsByGroup: Record<string, string[]>;
  };
}

interface RegisterResponse {
  statusCode: number;
  intOpCode: string;
  data: {
    id: string;
    nombre: string;
    email: string;
    usuario: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL  = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'auth_user';
  private readonly PERMS_KEY = 'auth_perms_by_group';

  currentUser = signal<User | null>(this.getStoredUser());

  // Signal para notificar cuenta desactivada mid-session
  accountDeactivated = signal<boolean>(false);

  constructor(
    private router: Router,
    private http: HttpClient,
    private cookieService: CookieService,
    private permissionsService: PermissionsService,
  ) {
    this.restoreSession();
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password })
      );

      if (response.statusCode === 200) {
        const { token, user, permissionsByGroup } = response.data;

        this.cookieService.set(this.TOKEN_KEY, token, {
          expires: 1,
          secure: false,
          sameSite: 'Lax',
        });

        localStorage.setItem(this.USER_KEY, JSON.stringify({
          id:        user.id,
          name:      user.nombre,
          email:     user.email,
          usuario:   user.usuario,
          direccion: user.direccion,
        }));
        localStorage.setItem(this.PERMS_KEY, JSON.stringify(permissionsByGroup));

        this.currentUser.set({
          id:        user.id,
          name:      user.nombre,
          email:     user.email,
          usuario:   user.usuario,
          direccion: user.direccion,
        });

        this.permissionsService.setPermissionsByGroup(permissionsByGroup);

        const firstGroup = Object.keys(permissionsByGroup)[0];
        if (firstGroup) {
          this.permissionsService.refreshPermissionsForGroup(firstGroup);
        }

        this.accountDeactivated.set(false);
        return { success: true };
      }

      return { success: false, error: 'Credenciales inválidas' };
    } catch (err: any) {
      const intOpCode = err?.error?.intOpCode ?? '';
      const msg       = err?.error?.data ?? 'Error al iniciar sesión';

      if (intOpCode === 'SxGW401_INACTIVE') {
        return { success: false, error: 'INACTIVE' };
      }

      return { success: false, error: msg };
    }
  }

  async register(data: {
    nombre: string;
    email: string;
    usuario: string;
    password: string;
    confirmPassword: string;
    direccion?: string;
    telefono?: string;
    fecha_nacimiento?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, data)
      );

      if (response.statusCode === 201) {
        return { success: true };
      }

      return { success: false, error: 'Error al registrar' };
    } catch (err: any) {
      const msg = err?.error?.data ?? 'Error al registrar usuario';
      return { success: false, error: msg };
    }
  }

  // Llamado por el interceptor cuando detecta 401_INACTIVE mid-session
  handleDeactivated(): void {
    this.accountDeactivated.set(true);
    this.forceLogout();
  }

  forceLogout(): void {
    this.cookieService.delete(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMS_KEY);
    this.currentUser.set(null);
    this.permissionsService.clearPermissions();
    this.router.navigate(['/login'], {
      queryParams: { reason: 'deactivated' },
    });
  }

  restoreSession(): void {
    const token = this.cookieService.get(this.TOKEN_KEY);
    if (!token) return;

    const permsRaw = localStorage.getItem(this.PERMS_KEY);
    if (permsRaw) {
      const permsByGroup = JSON.parse(permsRaw);
      this.permissionsService.setPermissionsByGroup(permsByGroup);

      const firstGroup = Object.keys(permsByGroup)[0];
      if (firstGroup) {
        this.permissionsService.refreshPermissionsForGroup(firstGroup);
      }
    }
  }

  updateUser(updated: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  logout(): void {
    this.cookieService.delete(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMS_KEY);
    this.currentUser.set(null);
    this.permissionsService.clearPermissions();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.cookieService.check(this.TOKEN_KEY);
  }

  getToken(): string {
    return this.cookieService.get(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}