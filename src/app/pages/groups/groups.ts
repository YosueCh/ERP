import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../core/directives/has-permission';
import {
  GroupDataService,
  GroupData,
  GroupMember,
} from '../../core/services/group-data';

export interface Group {
  id: number;
  nombre: string;
  autor: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
  perteneceUsuario: boolean;
  miembros: GroupMember[];
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    FormsModule,
    Card,
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
    HasPermissionDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class GroupsComponent {
  searchTerm = '';
  newMemberEmail = '';

  dialogVisible = false;
  isEditing = false;
  selectedGroup: Group = this.emptyGroup();

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private groupDataService: GroupDataService,
  ) {}

  get groups(): Group[] {
    return this.groupDataService.getGroups().map((group: GroupData) => ({
      id: group.id,
      nombre: group.nombre,
      autor: group.autor,
      integrantes: group.miembros.length,
      tickets: group.tickets.length,
      descripcion: group.descripcion,
      perteneceUsuario: group.perteneceUsuario,
      miembros: [...group.miembros],
    }));
  }

  get filteredGroups(): Group[] {
    if (!this.searchTerm.trim()) return this.groups;

    const term = this.searchTerm.toLowerCase();
    return this.groups.filter(g =>
      g.nombre.toLowerCase().includes(term) ||
      g.autor.toLowerCase().includes(term) ||
      g.descripcion.toLowerCase().includes(term)
    );
  }

  get totalGroups(): number {
    return this.groups.length;
  }

  get totalTickets(): number {
    return this.groups.reduce((a, g) => a + g.tickets, 0);
  }

  get totalIntegrantes(): number {
    return this.groups.reduce((a, g) => a + g.integrantes, 0);
  }

  get totalPropios(): number {
    return this.groups.filter(g => g.perteneceUsuario).length;
  }

  emptyGroup(): Group {
    return {
      id: 0,
      nombre: '',
      autor: '',
      integrantes: 0,
      tickets: 0,
      descripcion: '',
      perteneceUsuario: false,
      miembros: [],
    };
  }

  goToGroupDashboard(group: Group): void {

  this.router.navigate(['/group-dashboard', group.id], {
    state: {
      group: {
        id: group.id,
        nombre: group.nombre,
        descripcion: group.descripcion,
        integrantes: group.integrantes,
        tickets: group.tickets,
        miembros: group.miembros,
      },
    },
  });

}

  openNew(): void {
    this.selectedGroup = this.emptyGroup();
    this.newMemberEmail = '';
    this.isEditing = false;
    this.dialogVisible = true;
  }

  openEdit(group: Group): void {
    this.selectedGroup = {
      ...group,
      miembros: [...group.miembros],
    };
    this.newMemberEmail = '';
    this.isEditing = true;
    this.dialogVisible = true;
  }

  save(): void {
    if (!this.selectedGroup.nombre.trim() || !this.selectedGroup.autor.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Nombre y autor son obligatorios',
      });
      return;
    }

    if (this.isEditing) {
      const currentGroup = this.groupDataService.getGroupById(this.selectedGroup.id);

      if (!currentGroup) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el grupo a editar',
        });
        return;
      }

      const updatedGroup: GroupData = {
        ...currentGroup,
        nombre: this.selectedGroup.nombre,
        autor: this.selectedGroup.autor,
        descripcion: this.selectedGroup.descripcion,
        perteneceUsuario: this.selectedGroup.perteneceUsuario,
        miembros: [...this.selectedGroup.miembros],
      };

      this.groupDataService.updateGroup(updatedGroup);

      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Grupo actualizado correctamente',
      });
    } else {
      const newGroup: GroupData = {
        id: Date.now(),
        nombre: this.selectedGroup.nombre,
        autor: this.selectedGroup.autor,
        descripcion: this.selectedGroup.descripcion,
        perteneceUsuario: this.selectedGroup.perteneceUsuario,
        miembros: [...this.selectedGroup.miembros],
        tickets: [],
      };

      this.groupDataService.addGroup(newGroup);

      this.messageService.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Grupo creado correctamente',
      });
    }

    this.dialogVisible = false;
  }

  addMember(): void {
    const email = this.newMemberEmail.trim().toLowerCase();

    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Debes ingresar un email',
      });
      return;
    }

    const exists = this.selectedGroup.miembros.some(
      m => m.email.toLowerCase() === email
    );

    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicado',
        detail: 'Ese usuario ya pertenece al grupo',
      });
      return;
    }

    const nombreBase = email.split('@')[0];
    const nombreFormateado = nombreBase
      .split(/[.\-_]/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');

    const newMember: GroupMember = {
      id: Date.now(),
      nombre: nombreFormateado || 'Usuario',
      email,
    };

    this.selectedGroup.miembros = [...this.selectedGroup.miembros, newMember];
    this.selectedGroup.integrantes = this.selectedGroup.miembros.length;
    this.newMemberEmail = '';

    this.messageService.add({
      severity: 'success',
      summary: 'Usuario agregado',
      detail: 'Se agregó al grupo',
    });
  }

  removeMember(member: GroupMember): void {
    this.selectedGroup.miembros = this.selectedGroup.miembros.filter(
      m => m.id !== member.id
    );
    this.selectedGroup.integrantes = this.selectedGroup.miembros.length;

    this.messageService.add({
      severity: 'info',
      summary: 'Usuario eliminado',
      detail: 'Se eliminó del grupo',
    });
  }

  confirmDelete(group: Group): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el grupo "${group.nombre}"?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      accept: () => {
        this.groupDataService.deleteGroup(group.id);

        this.messageService.add({
          severity: 'info',
          summary: 'Eliminado',
          detail: 'Grupo eliminado correctamente',
        });
      },
    });
  }
}