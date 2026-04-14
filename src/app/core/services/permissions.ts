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
  private userPermissions  = signal<string[]>([]);
  private permissionsByGroup = signal<Record<string, string[]>>({});
  private currentGroupId   = signal<string | null>(null);
  private adminUser        = signal<boolean>(false);

  setPermissionsByGroup(permsByGroup: Record<string, string[]>): void {
    this.permissionsByGroup.set(permsByGroup);

    // Detectar si es admin: tiene todos los permisos clave en algún grupo
    const adminPerms = [
      'group:delete', 'ticket:delete', 'user:delete',
      'ticket:edit_state', 'user:add', 'group:add',
    ];
    const isAdmin = Object.values(permsByGroup).some(perms =>
      adminPerms.every(p => perms.includes(p))
    );
    this.adminUser.set(isAdmin);
  }

  refreshPermissionsForGroup(groupId: string): void {
  this.currentGroupId.set(groupId);
  const allPerms = this.permissionsByGroup();
  console.log('permissionsByGroup keys:', Object.keys(allPerms));
  console.log('groupId buscado:', groupId);
  const perms = allPerms[groupId] ?? allPerms[Number(groupId)] ?? [];
  console.log('perms encontrados:', perms);
  this.userPermissions.set(perms);
}

  setPermissions(perms: string[]): void {
    this.userPermissions.set(perms);
  }

  setIsAdmin(value: boolean): void {
    this.adminUser.set(value);
  }

  clearPermissions(): void {
    this.userPermissions.set([]);
    this.permissionsByGroup.set({});
    this.currentGroupId.set(null);
    this.adminUser.set(false);
  }

  hasPermission(permiso: string): boolean {
    if (this.adminUser()) return true;
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

  hasPermissionInGroup(permiso: string, groupId: string): boolean {
    const perms = this.permissionsByGroup()[groupId] ?? [];
    return perms.includes(permiso);
  }

  isAdmin(): boolean {
    return this.adminUser();
  }
}