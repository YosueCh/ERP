import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../core/directives/has-permission';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    AvatarModule,
    DividerModule,
    SkeletonModule,
    ToggleSwitch,
    SelectModule,
    HasPermissionDirective,
    CardModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-groups.html',
  styleUrl: './admin-groups.css',
})
export class AdminGroupsComponent implements OnInit {
  groups: any[] = [];
  allUsers: any[] = [];
  allPermisos: any[] = [];
  loading = true;
  searchTerm = '';

  dialogVisible = false;
  permDialogVisible = false;
  isEditing = false;
  newMemberEmail = '';

  selectedGroup: any = this.emptyGroup();
  selectedMember: any = null;
  memberPermisos: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  getPermisoLabel(permiso: any): string {
  const labelMap: Record<string, string> = {
    'ticket:edit_state': 'Mover todos los tickets',
  };
  return labelMap[permiso.clave] ?? permiso.label;
  }
  async ngOnInit(): Promise<void> {
    await this.loadUsers();    // primero usuarios (necesario para cruzar activo)
    await this.loadPermisos(); // luego permisos
    await this.loadGroups();   // luego grupos (ya tiene allUsers disponible)
  }

  async loadGroups(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.apiService.getGroups().toPromise();
      this.groups = (response?.data ?? []).map((g: any) => ({
        id:          g.id,
        nombre:      g.nombre,
        descripcion: g.descripcion ?? '',
        autor:       g.autor?.nombre ?? 'Sin autor',
        integrantes: g.miembros?.length ?? 0,
        miembros:    (g.miembros ?? []).filter((m: any) => m && m.id).map((m: any) => {
          const userFull = this.allUsers.find((u: any) => u.id === m.id);
          return { ...m, activo: userFull?.activo ?? true };
        }),
      }));
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos',
      });
    } finally {
      this.loading = false;
    }
  }

  async loadUsers(): Promise<void> {
    try {
      const response = await this.apiService.getUsers().toPromise();
      this.allUsers = response?.data ?? [];
    } catch {
      console.error('Error cargando usuarios');
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

  get filteredGroups(): any[] {
    if (!this.searchTerm.trim()) return this.groups;
    const term = this.searchTerm.toLowerCase();
    return this.groups.filter(
      (g) =>
        g.nombre.toLowerCase().includes(term) ||
        g.autor.toLowerCase().includes(term) ||
        g.descripcion.toLowerCase().includes(term),
    );
  }

  get permissionGroups(): string[] {
    return [...new Set(this.allPermisos.map((p: any) => p.grupo))];
  }

  getPermsByGroup(grupo: string): any[] {
    return this.allPermisos.filter((p: any) => p.grupo === grupo);
  }

  getMemberPermsByGroup(grupo: string): any[] {
    return this.memberPermisos.filter((p: any) => p.grupo === grupo);
  }

  hasPermiso(clave: string): boolean {
    return this.memberPermisos.some((p: any) => p.clave === clave && p.activo);
  }

  emptyGroup(): any {
    return { id: 0, nombre: '', descripcion: '', miembros: [] };
  }

  openNew(): void {
    this.selectedGroup = this.emptyGroup();
    this.newMemberEmail = '';
    this.isEditing = false;
    this.dialogVisible = true;
  }

  openEdit(group: any): void {
    this.selectedGroup = { ...group, miembros: [...(group.miembros ?? [])] };
    this.newMemberEmail = '';
    this.isEditing = true;
    this.dialogVisible = true;
  }

  async save(): Promise<void> {
    if (!this.selectedGroup.nombre.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'El nombre es obligatorio',
      });
      return;
    }

    try {
      if (this.isEditing) {
        await this.apiService
          .updateGroup(this.selectedGroup.id, {
            nombre: this.selectedGroup.nombre,
            descripcion: this.selectedGroup.descripcion,
          })
          .toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Grupo actualizado',
        });
      } else {
        await this.apiService
          .createGroup({
            nombre: this.selectedGroup.nombre,
            descripcion: this.selectedGroup.descripcion,
          })
          .toPromise();
        this.messageService.add({
          severity: 'success',
          summary: 'Creado',
          detail: 'Grupo creado correctamente',
        });
      }
      this.dialogVisible = false;
      await this.loadGroups();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el grupo',
      });
    }
  }

  async addMember(): Promise<void> {
    const email = this.newMemberEmail.trim().toLowerCase();
    if (!email) return;

    const user = this.allUsers.find((u: any) => u.email.toLowerCase() === email);
    if (!user) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No encontrado',
        detail: 'No existe un usuario con ese email',
      });
      return;
    }

    if (!user.activo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Usuario inactivo',
        detail: 'No puedes agregar un usuario con cuenta desactivada',
      });
      return;
    }

    const exists = this.selectedGroup.miembros.some((m: any) => m.id === user.id);
    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicado',
        detail: 'Ese usuario ya pertenece al grupo',
      });
      return;
    }

    try {
      if (this.isEditing) {
        await this.apiService.addMember(this.selectedGroup.id, user.id).toPromise();
      }
      this.selectedGroup.miembros = [...this.selectedGroup.miembros, user];
      this.newMemberEmail = '';
      this.messageService.add({
        severity: 'success',
        summary: 'Agregado',
        detail: 'Miembro agregado al grupo',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo agregar el miembro',
      });
    }
  }

  async removeMember(member: any): Promise<void> {
    try {
      if (this.isEditing) {
        await this.apiService.removeMember(this.selectedGroup.id, member.id).toPromise();
      }
      this.selectedGroup.miembros = this.selectedGroup.miembros.filter(
        (m: any) => m.id !== member.id,
      );
      this.messageService.add({
        severity: 'info',
        summary: 'Eliminado',
        detail: 'Miembro eliminado del grupo',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el miembro',
      });
    }
  }

  async openPermissions(group: any, member: any): Promise<void> {
    this.selectedGroup = group;
    this.selectedMember = member;
    this.memberPermisos = [];

    try {
      const response = await this.apiService.getGroupPermissions(group.id, member.id).toPromise();
      const data = response?.data ?? [];

      const activosMap: Record<string, { permiso_id: number; activo: boolean }> = {};
      for (const p of data) {
        activosMap[p.permisos.clave] = {
          permiso_id: p.permiso_id,
          activo: p.activo,
        };
      }

      this.memberPermisos = this.allPermisos.map((p: any) => ({
        id:         p.id,
        clave:      p.clave,
        grupo:      p.grupo,
        label:      p.label,
        permiso_id: activosMap[p.clave]?.permiso_id ?? p.id,
        activo:     activosMap[p.clave]?.activo ?? false,
      }));
    } catch {
      console.error('Error cargando permisos del miembro');
    }

    this.permDialogVisible = true;
  }

  togglePermiso(clave: string, activo: boolean): void {
    const perm = this.memberPermisos.find((p: any) => p.clave === clave);
    if (perm) perm.activo = activo;
  }

  async savePermissions(): Promise<void> {
    try {
      const permisos = this.memberPermisos.map((p: any) => ({
        permiso_id: p.permiso_id ?? p.id,
        activo: p.activo,
      }));

      await this.apiService
        .updateGroupPermissions(this.selectedGroup.id, {
          grupo_id:   this.selectedGroup.id,
          usuario_id: this.selectedMember.id,
          permisos,
        })
        .toPromise();

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

  confirmDelete(group: any): void {
  this.confirmationService.confirm({
    message: `¿Estás seguro de eliminar el grupo "${group.nombre}"? Esta acción no se puede deshacer.`,
    header: 'Eliminar grupo',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptButtonStyleClass: 'p-button-danger',
    rejectButtonStyleClass: 'p-button-secondary',
    accept: async () => {
      try {
        await this.apiService.deleteGroup(group.id).toPromise();
        this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: `Grupo "${group.nombre}" eliminado` });
        await this.loadGroups();
      } catch {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el grupo' });
      }
    },
  });
}
}