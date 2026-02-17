import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionsService } from './permissions';

export interface User {
  name: string;
  email: string;
  usuario: string;
  direccion: string;
}

interface JwtPayload {
  user: User;
  jwtperms: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(
    private router: Router,
    private permissionsService: PermissionsService
  ) {
    // Restaurar permisos al inicializar el servicio
    this.restorePermissions();
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'admin@erp.com' && password === 'aj2$1833$!') {
          const fakeJwtPayload: JwtPayload = {
            user: {
              name: 'Administrador',
              email,
              usuario: 'admin',
              direccion: 'Av. Principal 123',
            },
            jwtperms: [
              'group:view', 'group:edit', 'group:add', 'group:delete',
              'ticket:view', 'ticket:edit', 'ticket:add', 'ticket:delete', 'ticket:edit_state',
              'user:view', 'users:view', 'user:edit', 'user:add', 'user:delete',
            ],
          };

          this.setSession(fakeJwtPayload);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  }

  private setSession(payload: JwtPayload): void {
    const token = this.encodeToken(payload);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(payload.user));
    this.currentUser.set(payload.user);
    this.permissionsService.setPermissions(payload.jwtperms);
  }

  private encodeToken(payload: JwtPayload): string {
    return btoa(JSON.stringify(payload));
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  restorePermissions(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      const payload = this.decodeToken(token);
      if (payload?.jwtperms) {
        this.permissionsService.setPermissions(payload.jwtperms);
      }
    }
  }

  updateUser(updated: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.permissionsService.clearPermissions();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}