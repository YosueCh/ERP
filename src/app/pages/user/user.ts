import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Card } from 'primeng/card';
import { Avatar } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

import { AuthService, User } from '../../core/services/auth';
import { HasPermissionDirective } from '../../core/directives/has-permission';
import { GroupDataService } from '../../core/services/group-data';
import { PermissionsService } from '../../core/services/permissions';

type TicketEstado = 'pendiente' | 'en_progreso' | 'revision' | 'hecho';
type TicketPrioridad = 'baja' | 'media' | 'alta';

interface UserTicket {
  id: number;
  titulo: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  asignadoA: string;
  grupo: string;
  fechaLimite?: string | null;
}

// Representa un usuario que viene de la "base de datos"
interface ManagedUser {
  id: number;
  name: string;
  email: string;
  usuario: string;
  permissions: string[];
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    FormsModule,
    Card,
    Avatar,
    TagModule,
    Divider,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    ToggleSwitch,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent {
  dialogVisible = false;

  editData = {
    name: '',
    email: '',
    usuario: '',
    direccion: '',
    password: '',
    confirmPassword: '',
  };

  // Usuario seleccionado en el panel de administración
  selectedManagedUser: ManagedUser | null = null;

  // Simulación de usuarios provenientes de la base de datos
  managedUsers: ManagedUser[] = [
    {
      id: 1,
      name: 'Carlos Ruiz',
      email: 'carlos@erp.com',
      usuario: 'carlos',
      permissions: [
        'group:view',
        'ticket:view',
        'ticket:edit',
        'ticket:add',
        'ticket:edit_state',
        'user:view',
      ],
    },
    {
      id: 2,
      name: 'Ana García',
      email: 'ana.garcia@erp.com',
      usuario: 'ana',
      permissions: [
        'group:view',
        'group:add',
        'ticket:view',
        'ticket:add',
        'user:view',
        'users:view',
      ],
    },
  ];

  readonly ALL_PERMISSIONS = [
    { key: 'group:view',        label: 'Ver grupos',             group: 'Grupos'   },
    { key: 'group:edit',        label: 'Editar grupos',          group: 'Grupos'   },
    { key: 'group:add',         label: 'Agregar grupos',         group: 'Grupos'   },
    { key: 'group:delete',      label: 'Eliminar grupos',        group: 'Grupos'   },
    { key: 'ticket:view',       label: 'Ver tickets',            group: 'Tickets'  },
    { key: 'ticket:edit',       label: 'Editar tickets',         group: 'Tickets'  },
    { key: 'ticket:add',        label: 'Agregar tickets',        group: 'Tickets'  },
    { key: 'ticket:delete',     label: 'Eliminar tickets',       group: 'Tickets'  },
    { key: 'ticket:edit_state', label: 'Cambiar estado',         group: 'Tickets'  },
    { key: 'user:view',         label: 'Ver perfil propio',      group: 'Usuarios' },
    { key: 'users:view',        label: 'Ver todos los usuarios', group: 'Usuarios' },
    { key: 'user:edit',         label: 'Editar usuarios',        group: 'Usuarios' },
    { key: 'user:add',          label: 'Agregar usuarios',       group: 'Usuarios' },
    { key: 'user:delete',       label: 'Eliminar usuarios',      group: 'Usuarios' },
  ];

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private groupDataService: GroupDataService,
    private permissionsService: PermissionsService,
  ) {}

  // ── Usuario actual ────────────────────────────────────────────────────────

  get user(): User | null {
    return this.authService.currentUser();
  }

  get userInitial(): string {
    return (this.user?.name ?? 'U').charAt(0).toUpperCase();
  }

  // ── Tickets asignados ─────────────────────────────────────────────────────

  get assignedTickets(): UserTicket[] {
    const nombre = this.user?.name?.trim().toLowerCase() ?? '';
    if (!nombre) return [];

    return this.groupDataService
      .getGroups()
      .flatMap(group =>
        group.tickets.map(ticket => ({
          id: ticket.id,
          titulo: ticket.titulo,
          estado: ticket.estado,
          prioridad: ticket.prioridad,
          asignadoA: ticket.asignadoA,
          grupo: group.nombre,
          fechaLimite: ticket.fechaLimite ?? null,
        }))
      )
      .filter(ticket => ticket.asignadoA.trim().toLowerCase() === nombre);
  }

  get totalAsignados(): number {
    return this.assignedTickets.length;
  }

  get totalPendientes(): number {
    return this.assignedTickets.filter(
      t => t.estado === 'pendiente' || t.estado === 'revision'
    ).length;
  }

  get totalEnProgreso(): number {
    return this.assignedTickets.filter(t => t.estado === 'en_progreso').length;
  }

  get totalHechos(): number {
    return this.assignedTickets.filter(t => t.estado === 'hecho').length;
  }

  // ── Edición de perfil ─────────────────────────────────────────────────────

  openEdit(): void {
    this.editData = {
      name:            this.user?.name      ?? '',
      email:           this.user?.email     ?? '',
      usuario:         this.user?.usuario   ?? '',
      direccion:       this.user?.direccion ?? '',
      password:        '',
      confirmPassword: '',
    };
    this.dialogVisible = true;
  }

  save(): void {
    if (!this.editData.name || !this.editData.email || !this.editData.usuario) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Nombre, email y usuario son obligatorios',
      });
      return;
    }

    if (this.editData.password && this.editData.password !== this.editData.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    const updated: User = {
      ...this.user!,
      name:      this.editData.name,
      email:     this.editData.email,
      usuario:   this.editData.usuario,
      direccion: this.editData.direccion,
    };

    this.authService.updateUser(updated);

    this.messageService.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Perfil actualizado correctamente',
    });

    this.dialogVisible = false;
  }

  // ── Helpers de etiquetas ──────────────────────────────────────────────────

  getEstadoLabel(estado: TicketEstado): string {
    const map: Record<TicketEstado, string> = {
      pendiente:   'Pendiente',
      en_progreso: 'En Progreso',
      revision:    'Revisión',
      hecho:       'Hecho',
    };
    return map[estado];
  }

  getEstadoSeverity(estado: TicketEstado): 'warn' | 'info' | 'secondary' | 'success' {
    const map: Record<TicketEstado, 'warn' | 'info' | 'secondary' | 'success'> = {
      pendiente:   'warn',
      en_progreso: 'info',
      revision:    'secondary',
      hecho:       'success',
    };
    return map[estado];
  }

  getPrioridadLabel(prioridad: TicketPrioridad): string {
    const map: Record<TicketPrioridad, string> = {
      baja:  'Baja',
      media: 'Media',
      alta:  'Alta',
    };
    return map[prioridad];
  }

  getPrioridadSeverity(prioridad: TicketPrioridad): 'secondary' | 'warn' | 'danger' {
    const map: Record<TicketPrioridad, 'secondary' | 'warn' | 'danger'> = {
      baja:  'secondary',
      media: 'warn',
      alta:  'danger',
    };
    return map[prioridad];
  }

  // ── Super admin ───────────────────────────────────────────────────────────

  get isSuperAdmin(): boolean {
    return this.permissionsService.hasAllPermissions(
      this.ALL_PERMISSIONS.map(p => p.key)
    );
  }

  get permissionGroups(): string[] {
    return [...new Set(this.ALL_PERMISSIONS.map(p => p.group))];
  }

  getPermsByGroup(group: string) {
    return this.ALL_PERMISSIONS.filter(p => p.group === group);
  }

  // ── Selección de usuario a gestionar ─────────────────────────────────────

  selectManagedUser(u: ManagedUser): void {
    // Si ya estaba seleccionado, deseleccionar (toggle)
    this.selectedManagedUser = this.selectedManagedUser?.id === u.id ? null : u;
  }

  getManagedUserInitial(u: ManagedUser): string {
    return u.name.charAt(0).toUpperCase();
  }

  // ── Permisos del usuario seleccionado ────────────────────────────────────

  managedUserHasPermission(key: string): boolean {
    return this.selectedManagedUser?.permissions.includes(key) ?? false;
  }

  isManagedGroupFullyEnabled(group: string): boolean {
    return this.getPermsByGroup(group).every(p =>
      this.managedUserHasPermission(p.key)
    );
  }

  toggleManagedPermission(key: string, enabled: boolean): void {
    if (!this.selectedManagedUser) return;

    this.selectedManagedUser.permissions = enabled
      ? [...this.selectedManagedUser.permissions, key]
      : this.selectedManagedUser.permissions.filter(p => p !== key);

    this.messageService.add({
      severity: enabled ? 'success' : 'warn',
      summary:  enabled ? 'Permiso activado' : 'Permiso desactivado',
      detail:   `${this.ALL_PERMISSIONS.find(p => p.key === key)?.label ?? key} → ${this.selectedManagedUser.name}`,
      life: 2000,
    });
  }

  toggleManagedGroup(group: string, enabled: boolean): void {
    if (!this.selectedManagedUser) return;

    const keys = this.getPermsByGroup(group).map(p => p.key);

    this.selectedManagedUser.permissions = enabled
      ? [...new Set([...this.selectedManagedUser.permissions, ...keys])]
      : this.selectedManagedUser.permissions.filter(p => !keys.includes(p));

    this.messageService.add({
      severity: enabled ? 'success' : 'warn',
      summary:  enabled ? 'Grupo activado' : 'Grupo desactivado',
      detail:   `Permisos de "${group}" → ${this.selectedManagedUser.name}`,
      life: 2000,
    });
  }

  // Guardar cambios del usuario gestionado (preparado para llamada a API)
  saveManagedUserPermissions(): void {
    if (!this.selectedManagedUser) return;

    // TODO: reemplazar con llamada HTTP al backend, por ejemplo:
    // this.usersApiService.updatePermissions(
    //   this.selectedManagedUser.id,
    //   this.selectedManagedUser.permissions
    // ).subscribe(...)

    this.messageService.add({
      severity: 'success',
      summary:  'Permisos guardados',
      detail:   `Se actualizaron los permisos de ${this.selectedManagedUser.name}`,
    });
  }
}