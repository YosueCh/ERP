import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../core/directives/has-permission';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    DatePickerModule,
    InputMaskModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    AvatarModule,
    SkeletonModule,
    CardModule,
    ToggleSwitch,
    SelectModule,
    HasPermissionDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  allPermisos: any[] = [];
  loading = true;
  searchTerm = '';
  filtroActivo: 'todos' | 'activos' | 'inactivos' = 'todos';

  dialogVisible = false;
  isEditing = false;
  selectedUser: any = this.emptyUser();

  permDialogVisible = false;
  userGroups: any[] = [];
  selectedGroupId: any = null;
  memberPermisos: any[] = [];
  globalPermisos: any[] = [];
  loadingGroups = false;
  loadingPerms = false;
  permUser: any = null;

  readonly maxDate: Date = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  })();

  readonly minDate: Date = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 90);
    return d;
  })();

  readonly PASSWORD_MIN_LENGTH = 10;
  readonly PASSWORD_SPECIAL_CHARS = '!@#$%^&*()-_=+';

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadPermisos();
  }

  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.apiService.getUsers().toPromise();
      this.users = response?.data ?? [];
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los usuarios',
      });
    } finally {
      this.loading = false;
    }
  }

  async loadPermisos(): Promise<void> {
    try {
      const response = await this.apiService.getAllPermissions().toPromise();
      this.allPermisos = response?.data ?? [];
    } catch {
      console.error('Error cargando permisos');
    }
  }

  get filteredUsers(): any[] {
    let result = this.users;
    if (this.filtroActivo === 'activos') result = result.filter((u) => u.activo);
    else if (this.filtroActivo === 'inactivos') result = result.filter((u) => !u.activo);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.usuario?.toLowerCase().includes(term),
      );
    }
    return result;
  }

  // ── Permisos globales ─────────────────────────────────────────────────────
  get globalPermissionGroups(): string[] {
    return [
      ...new Set(
        this.allPermisos
          .filter(
            (p: any) =>
              p.grupo !== 'Tickets' &&
              p.clave !== 'group:edit' &&
              p.clave !== 'users:view' &&
              p.clave !== 'user:add' &&
              p.clave !== 'user:delete',
          )
          .map((p: any) => p.grupo),
      ),
    ];
  }

  getGlobalPermsByGroup(grupo: string): any[] {
    return this.globalPermisos.filter((p: any) => p.grupo === grupo);
  }

  toggleGlobalPermiso(clave: string, activo: boolean): void {
    const perm = this.globalPermisos.find((p: any) => p.clave === clave);
    if (perm) perm.activo = activo;
  }

  // ── Permisos por equipo ───────────────────────────────────────────────────
  get ticketPermissionGroups(): string[] {
    return [
      ...new Set(
        this.allPermisos
          .filter(
            (p: any) =>
              p.grupo === 'Tickets' || p.clave === 'group:edit' || p.clave === 'users:view',
          )
          .map((p: any) => p.grupo),
      ),
    ];
  }

  get permissionGroups(): string[] {
    return [...new Set(this.allPermisos.map((p: any) => p.grupo))];
  }

  getMemberPermsByGroup(grupo: string): any[] {
    return this.memberPermisos.filter((p: any) => p.grupo === grupo);
  }

  emptyUser(): any {
    return {
      id: null,
      nombre: '',
      email: '',
      usuario: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: null,
      password: '',
      confirmPassword: '',
      activo: true,
    };
  }

  getPermisoLabel(permiso: any): string {
    const labelMap: Record<string, string> = {
      'ticket:edit_state': 'Mover todos los tickets',
    };
    return labelMap[permiso.clave] ?? permiso.label;
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openNew(): void {
    this.selectedUser = this.emptyUser();
    this.isEditing = false;
    this.dialogVisible = true;
  }

  openEdit(user: any): void {
    this.selectedUser = { ...user, password: '', confirmPassword: '', fechaNacimiento: null };
    this.isEditing = true;
    this.dialogVisible = true;
  }

  private validatePassword(password: string): string | null {
    if (password.length < this.PASSWORD_MIN_LENGTH)
      return `La contraseña debe tener al menos ${this.PASSWORD_MIN_LENGTH} caracteres`;
    if (!/[!@#$%^&*()\-_=+]/.test(password))
      return `Debe incluir al menos un símbolo: ${this.PASSWORD_SPECIAL_CHARS}`;
    if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una letra mayúscula';
    if (!/[0-9]/.test(password)) return 'Debe incluir al menos un número';
    return null;
  }

  private validateAge(fecha: Date): boolean {
    const today = new Date();
    const birth = new Date(fecha);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  }

  private validatePhone(phone: string): boolean {
    return phone.replace(/\D/g, '').length === 10;
  }

  async save(): Promise<void> {
    if (
      !this.selectedUser.nombre.trim() ||
      !this.selectedUser.email.trim() ||
      !this.selectedUser.usuario.trim()
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Nombre, email y username son obligatorios',
      });
      return;
    }
    if (!this.isEditing) {
      if (
        !this.selectedUser.telefono ||
        !this.selectedUser.fechaNacimiento ||
        !this.selectedUser.password
      ) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Campos requeridos',
          detail: 'Completa todos los campos obligatorios',
        });
        return;
      }
      if (!this.validatePhone(this.selectedUser.telefono)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Teléfono inválido',
          detail: 'El número debe tener 10 dígitos',
        });
        return;
      }
      if (!this.validateAge(this.selectedUser.fechaNacimiento)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Edad no permitida',
          detail: 'El usuario debe ser mayor de 18 años',
        });
        return;
      }
      const pwError = this.validatePassword(this.selectedUser.password);
      if (pwError) {
        this.messageService.add({
          severity: 'error',
          summary: 'Contraseña inválida',
          detail: pwError,
        });
        return;
      }
      if (this.selectedUser.password !== this.selectedUser.confirmPassword) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Las contraseñas no coinciden',
        });
        return;
      }
    }
    try {
      if (this.isEditing) {
        await this.apiService
          .updateUser(this.selectedUser.id, {
            nombre: this.selectedUser.nombre,
            email: this.selectedUser.email,
            usuario: this.selectedUser.usuario,
            direccion: this.selectedUser.direccion,
          })
          .toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Usuario actualizado correctamente',
        });
      } else {
        await this.apiService
          .createUser({
            nombre: this.selectedUser.nombre,
            email: this.selectedUser.email,
            usuario: this.selectedUser.usuario,
            direccion: this.selectedUser.direccion,
            telefono: this.selectedUser.telefono.replace(/\D/g, ''),
            fecha_nacimiento: new Date(this.selectedUser.fechaNacimiento)
              .toISOString()
              .split('T')[0],
            password: this.selectedUser.password,
            confirmPassword: this.selectedUser.confirmPassword,
          })
          .toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Creado',
          detail: 'Usuario creado correctamente',
        });
      }
      this.dialogVisible = false;
      await this.loadUsers();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el usuario',
      });
    }
  }

  async toggleActivo(user: any): Promise<void> {
    try {
      await this.apiService.updateUser(user.id, { activo: !user.activo }).toPromise();
      user.activo = !user.activo;
      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: `Usuario ${user.activo ? 'activado' : 'desactivado'}`,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cambiar el estado',
      });
    }
  }

  async openPermissions(user: any): Promise<void> {
    this.permUser = user;
    this.userGroups = [];
    this.selectedGroupId = null;
    this.memberPermisos = [];
    this.globalPermisos = this.allPermisos
      .filter(
        (p: any) =>
          p.grupo !== 'Tickets' &&
          p.clave !== 'group:edit' &&
          p.clave !== 'users:view' &&
          p.clave !== 'user:add' &&
          p.clave !== 'user:delete',
      )
      .map((p: any) => ({ ...p, activo: false }));
    this.loadingGroups = true;
    this.permDialogVisible = true;

    try {
      const response = await this.apiService.getGroupsByUser(user.id).toPromise();
      this.userGroups = (response?.data ?? []).map((g: any) => ({
        ...g,
        label: g.nombre,
        value: g.id,
      }));

      if (this.userGroups.length > 0) {
        const firstGroupId = this.userGroups[0].value;
        const res = await this.apiService.getGroupPermissions(firstGroupId, user.id).toPromise();
        const data = res?.data ?? [];
        const activosMap: Record<string, boolean> = {};
        for (const p of data) activosMap[p.permisos.clave] = p.activo;
        this.globalPermisos = this.globalPermisos.map((p: any) => ({
          ...p,
          activo: activosMap[p.clave] ?? false,
        }));
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos del usuario',
      });
    } finally {
      this.loadingGroups = false;
    }
  }

  async onGroupSelect(groupId: any): Promise<void> {
    if (!groupId) return;
    this.memberPermisos = [];
    this.loadingPerms = true;
    try {
      const response = await this.apiService
        .getGroupPermissions(groupId, this.permUser.id)
        .toPromise();
      const data = response?.data ?? [];
      const activosMap: Record<string, { permiso_id: number; activo: boolean }> = {};
      for (const p of data)
        activosMap[p.permisos.clave] = { permiso_id: p.permiso_id, activo: p.activo };

      this.memberPermisos = this.allPermisos
        .filter(
          (p: any) => p.grupo === 'Tickets' || p.clave === 'group:edit' || p.clave === 'users:view',
        )
        .map((p: any) => ({
          id: p.id,
          clave: p.clave,
          grupo: p.grupo,
          label: p.label,
          permiso_id: activosMap[p.clave]?.permiso_id ?? p.id,
          activo: activosMap[p.clave]?.activo ?? false,
        }));
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los permisos',
      });
    } finally {
      this.loadingPerms = false;
    }
  }

  togglePermiso(clave: string, activo: boolean): void {
    const perm = this.memberPermisos.find((p: any) => p.clave === clave);
    if (perm) perm.activo = activo;
  }

  async savePermissions(): Promise<void> {
    try {
      const globalPerms = this.globalPermisos.map((p: any) => ({
        permiso_id: p.permiso_id ?? p.id,
        activo: p.activo,
      }));
      const ticketPerms = this.memberPermisos.map((p: any) => ({
        permiso_id: p.permiso_id ?? p.id,
        activo: p.activo,
      }));

      if (this.selectedGroupId) {
        await this.apiService
          .updateGroupPermissions(this.selectedGroupId, {
            grupo_id: this.selectedGroupId,
            usuario_id: this.permUser.id,
            permisos: [...globalPerms, ...ticketPerms],
          })
          .toPromise();
      }

      for (const group of this.userGroups) {
        if (group.value === this.selectedGroupId) continue;
        const res = await this.apiService
          .getGroupPermissions(group.value, this.permUser.id)
          .toPromise();
        const existingTickets = (res?.data ?? [])
          .filter(
            (p: any) =>
              p.permisos?.grupo === 'Tickets' ||
              p.permisos?.clave === 'group:edit' ||
              p.permisos?.clave === 'users:view',
          )
          .map((p: any) => ({ permiso_id: p.permiso_id, activo: p.activo }));

        await this.apiService
          .updateGroupPermissions(group.value, {
            grupo_id: group.value,
            usuario_id: this.permUser.id,
            permisos: [...globalPerms, ...existingTickets],
          })
          .toPromise();
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Permisos actualizados correctamente',
      });
      this.permDialogVisible = false;
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar permisos',
      });
    }
  }

  confirmDelete(user: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario "${user.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.apiService.deleteUser(user.id).toPromise();
          this.messageService.add({
            severity: 'info',
            summary: 'Eliminado',
            detail: 'Usuario eliminado',
          });
          await this.loadUsers();
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el usuario',
          });
        }
      },
    });
  }
}
