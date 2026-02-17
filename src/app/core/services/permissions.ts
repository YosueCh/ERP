import { Injectable, signal } from '@angular/core';

export const PERMISSIONS = {
  GROUP: {
    VIEW: 'group:view',
    EDIT: 'group:edit',
    ADD: 'group:add',
    DELETE: 'group:delete',
  },
  TICKET: {
    VIEW: 'ticket:view',
    EDIT: 'ticket:edit',
    ADD: 'ticket:add',
    DELETE: 'ticket:delete',
    EDIT_STATE: 'ticket:edit_state',
  },
  USER: {
    VIEW: 'user:view',
    VIEW_ALL: 'users:view',
    EDIT: 'user:edit',
    ADD: 'user:add',
    DELETE: 'user:delete',
  },
} as const;

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private userPermissions = signal<string[]>([]);

  setPermissions(perms: string[]): void {
    this.userPermissions.set(perms);
  }

  clearPermissions(): void {
    this.userPermissions.set([]);
  }

  hasPermission(permiso: string): boolean {
    return this.userPermissions().includes(permiso);
  }

  hasAnyPermission(permisos: string[]): boolean {
    return permisos.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permisos: string[]): boolean {
    return permisos.every(p => this.hasPermission(p));
  }

  getPermissions(): string[] {
    return this.userPermissions();
  }
}