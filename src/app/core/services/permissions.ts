import { Injectable, signal } from '@angular/core';

export const PERMISSIONS = {
  GROUP: {
    VIEW:   'group:view',
    EDIT:   'group:edit',
    ADD:    'group:add',
    DELETE: 'group:delete',
    MANAGE: 'group:manage',  
  },
  TICKET: {
    VIEW:       'ticket:view',
    EDIT:       'ticket:edit',
    ADD:        'ticket:add',
    DELETE:     'ticket:delete',
    EDIT_STATE: 'ticket:edit_state',
  },
  USER: {
    VIEW:     'user:view',
    VIEW_ALL: 'users:view',
    EDIT:     'user:edit',
    ADD:      'user:add',
    DELETE:   'user:delete',
    MANAGE:   'user:manage',  
  },
} as const;

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private userPermissions = signal<string[]>([]);
  private permissionsByGroup = signal<Record<string, string[]>>({});
  private currentGroupId = signal<string | null>(null);

  // Setear todos los permisos por grupo desde el login
  setPermissionsByGroup(permsByGroup: Record<string, string[]>): void {
    this.permissionsByGroup.set(permsByGroup);
  }

  // Cambiar el grupo activo y cargar sus permisos
  refreshPermissionsForGroup(groupId: string): void {
    this.currentGroupId.set(groupId);
    const perms = this.permissionsByGroup()[groupId] ?? [];
    this.userPermissions.set(perms);
  }

  // Setear permisos directamente (compatibilidad)
  setPermissions(perms: string[]): void {
    this.userPermissions.set(perms);
  }

  clearPermissions(): void {
    this.userPermissions.set([]);
    this.permissionsByGroup.set({});
    this.currentGroupId.set(null);
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

  getPermissionsByGroup(): Record<string, string[]> {
    return this.permissionsByGroup();
  }

  getCurrentGroupId(): string | null {
    return this.currentGroupId();
  }

  // Verifica si tiene permiso en un grupo específico
  hasPermissionInGroup(permiso: string, groupId: string): boolean {
    const perms = this.permissionsByGroup()[groupId] ?? [];
    return perms.includes(permiso);
  }
}