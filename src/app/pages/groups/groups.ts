import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth';
import { PermissionsService } from '../../core/services/permissions';
import { HasPermissionDirective } from '../../core/directives/has-permission';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    FormsModule, SkeletonModule, ToastModule,
    InputTextModule, DialogModule, ButtonModule,
    AvatarModule, AutoCompleteModule, ConfirmDialogModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class GroupsComponent implements OnInit {
  groups: any[]    = [];
  allUsers: any[]  = [];
  loading          = true;
  searchTerm       = '';
  activeFilter     = 'todos';

  newGroupVisible  = false;
  newGroup         = { nombre: '', descripcion: '' };
  newGroupMembers: any[] = [];
  newMemberToAdd: any   = null;
  memberSuggestions: any[] = [];
  savingGroup      = false;

  private readonly memberColors = [
    '#6366f1', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#3b82f6',
  ];

  readonly today: string = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadAllUsers();
  }

  async loadGroups(): Promise<void> {
    this.loading = true;
    try {
      const userId = this.authService.currentUser()?.id;
      if (!userId) return;
      const response = await this.apiService.getGroupsByUser(userId).toPromise();
      this.groups = (response?.data ?? []).map((g: any) => ({
        id:          g.id,
        nombre:      g.nombre,
        descripcion: g.descripcion ?? '',
        autor:       g.autor?.nombre ?? 'Sin autor',
        integrantes: g.miembros?.length ?? 0,
        createdAt:   g.created_at,
      }));
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grupos' });
    } finally {
      this.loading = false;
    }
  }

  async loadAllUsers(): Promise<void> {
    try {
      const res = await this.apiService.getUsers().toPromise();
      this.allUsers = (res?.data ?? []).filter((u: any) => u.activo);
    } catch {
      console.error('Error cargando usuarios');
    }
  }

  openNewGroup(): void {
    this.newGroup        = { nombre: '', descripcion: '' };
    this.newGroupMembers = [];
    this.newMemberToAdd  = null;
    this.newGroupVisible = true;
  }

  searchMember(event: any): void {
    const query = event.query.toLowerCase();
    this.memberSuggestions = this.allUsers
      .filter((u: any) =>
        u.nombre.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
      .filter((u: any) => !this.newGroupMembers.find((m: any) => m.id === u.id));
  }

  addNewGroupMember(): void {
    if (!this.newMemberToAdd?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Sin selección', detail: 'Selecciona un usuario de la lista' });
      return;
    }
    if (this.newGroupMembers.find((m: any) => m.id === this.newMemberToAdd.id)) {
      this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Este usuario ya está en la lista' });
      return;
    }
    this.newGroupMembers.push(this.newMemberToAdd);
    this.newMemberToAdd = null;
  }

  removeNewGroupMember(userId: string): void {
    this.newGroupMembers = this.newGroupMembers.filter((m: any) => m.id !== userId);
  }

  async saveNewGroup(): Promise<void> {
    if (!this.newGroup.nombre.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El nombre del grupo es obligatorio' });
      return;
    }
    this.savingGroup = true;
    try {
      const res = await this.apiService.createGroup({
        nombre:      this.newGroup.nombre.trim(),
        descripcion: this.newGroup.descripcion.trim(),
      }).toPromise();

      const groupId = res?.data?.id;
      if (groupId && this.newGroupMembers.length > 0) {
        for (const member of this.newGroupMembers) {
          await this.apiService.addMember(groupId, member.id).toPromise();
        }
      }

      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Grupo creado correctamente' });
      this.newGroupVisible = false;
      await this.loadGroups();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el grupo' });
    } finally {
      this.savingGroup = false;
    }
  }

  confirmDeleteGroup(group: any, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo "${group.nombre}"? Esta acción no se puede deshacer.`,
      header: 'Eliminar grupo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
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

  get filteredGroups(): any[] {
    let result = [...this.groups];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(g =>
        g.nombre.toLowerCase().includes(term) ||
        g.autor.toLowerCase().includes(term) ||
        g.descripcion.toLowerCase().includes(term)
      );
    }
    if (this.activeFilter === 'recientes') {
      result = result
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    }
    return result;
  }

  get totalMiembros(): number {
    return this.groups.reduce((acc, g) => acc + g.integrantes, 0);
  }

  getMemberRange(count: number): number[] {
    return Array.from({ length: Math.min(count, 3) }, (_, i) => i);
  }

  getMemberColor(index: number): string {
    return this.memberColors[index % this.memberColors.length];
  }

  goToGroupDashboard(group: any): void {
    this.permissionsService.refreshPermissionsForGroup(String(group.id));
    this.router.navigate(['/group-dashboard', group.id], { state: { group } });
  }
}