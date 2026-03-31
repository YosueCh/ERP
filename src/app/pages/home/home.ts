import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import {
  GroupDataService,
  GroupData,
  GroupMember,
  Ticket,
  TicketEstado,
  TicketPrioridad,
} from '../../core/services/group-data';

export interface UserGroup {
  id: number;
  nombre: string;
  descripcion: string;
  integrantes: number;
  tickets: number;
  miembros: GroupMember[];
}

type HomeTicketFilter = 'todos' | 'mis_tickets' | 'urgentes' | 'sin_asignar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AvatarModule, TagModule, ButtonModule, SelectModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  filtroTickets: HomeTicketFilter = 'todos';

  constructor(
    private authService: AuthService,
    private router: Router,
    private groupDataService: GroupDataService,
  ) {}

  get userGroups(): UserGroup[] {
    return this.groupDataService.getMyGroups().map((group: GroupData) => ({
      id: group.id,
      nombre: group.nombre,
      descripcion: group.descripcion,
      integrantes: group.miembros.length,
      tickets: group.tickets.length,
      miembros: group.miembros,
    }));
  }

  get allMyGroupTickets(): Array<Ticket & { groupId: number; groupName: string }> {
    return this.groupDataService.getMyGroups().flatMap(group =>
      group.tickets.map(ticket => ({
        ...ticket,
        groupId: group.id,
        groupName: group.nombre,
      }))
    );
  }

  get filteredHomeTickets(): Array<Ticket & { groupId: number; groupName: string }> {
    let tickets = [...this.allMyGroupTickets];

    switch (this.filtroTickets) {
      case 'mis_tickets':
        tickets = tickets.filter(t => t.asignadoA === this.currentUserName);
        break;

      case 'urgentes':
        tickets = tickets.filter(t => t.prioridad === 'alta');
        break;

      case 'sin_asignar':
        tickets = tickets.filter(
          t => !t.asignadoA || t.asignadoA.trim().toLowerCase() === 'sin asignar'
        );
        break;
    }

    tickets.sort((a, b) => {
      const prioridadA = this.getPrioridadOrden(a.prioridad);
      const prioridadB = this.getPrioridadOrden(b.prioridad);

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      const fechaA = a.fechaLimite ? new Date(a.fechaLimite).getTime() : Number.MAX_SAFE_INTEGER;
      const fechaB = b.fechaLimite ? new Date(b.fechaLimite).getTime() : Number.MAX_SAFE_INTEGER;

      return fechaA - fechaB;
    });

    return tickets.slice(0, 8);
  }

  get totalMyTickets(): number {
    return this.allMyGroupTickets.filter(t => t.asignadoA === this.currentUserName).length;
  }

  get totalPendientes(): number {
    return this.allMyGroupTickets.filter(t => t.estado === 'pendiente').length;
  }

  get totalEnProgreso(): number {
    return this.allMyGroupTickets.filter(t => t.estado === 'en_progreso').length;
  }

  get totalPorVencer(): number {
    const today = new Date();
    const nextThreeDays = new Date();
    nextThreeDays.setDate(today.getDate() + 3);

    return this.allMyGroupTickets.filter(t => {
      if (!t.fechaLimite) return false;
      const limitDate = new Date(t.fechaLimite);
      return limitDate >= today && limitDate <= nextThreeDays;
    }).length;
  }

  get currentUserName(): string {
    return this.authService.currentUser()?.name ?? 'Administrador';
  }

  get userName(): string {
    return this.authService.currentUser()?.name ?? 'Usuario';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  enterGroup(group: UserGroup): void {
    this.router.navigate(['/group-dashboard', group.id], {
      state: { group }
    });
  }

  openTicketGroup(ticket: { groupId: number }): void {
    const group = this.userGroups.find(g => g.id === ticket.groupId);
    if (!group) return;

    this.router.navigate(['/group-dashboard', group.id], {
      state: { group }
    });
  }

  setFiltroTickets(filtro: HomeTicketFilter): void {
    this.filtroTickets = filtro;
  }

  getEstadoLabel(estado: TicketEstado): string {
    const map: Record<TicketEstado, string> = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      revision: 'Revisión',
      hecho: 'Hecho',
    };
    return map[estado];
  }

  getEstadoSeverity(estado: TicketEstado): 'warn' | 'info' | 'secondary' | 'success' {
    const map: Record<TicketEstado, 'warn' | 'info' | 'secondary' | 'success'> = {
      pendiente: 'warn',
      en_progreso: 'info',
      revision: 'secondary',
      hecho: 'success',
    };
    return map[estado];
  }

  getPrioridadLabel(prioridad: TicketPrioridad): string {
    const map: Record<TicketPrioridad, string> = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
    };
    return map[prioridad];
  }

  getPrioridadSeverity(prioridad: TicketPrioridad): 'secondary' | 'warn' | 'danger' {
    const map: Record<TicketPrioridad, 'secondary' | 'warn' | 'danger'> = {
      baja: 'secondary',
      media: 'warn',
      alta: 'danger',
    };
    return map[prioridad];
  }

  private getPrioridadOrden(prioridad: TicketPrioridad): number {
    const orden: Record<TicketPrioridad, number> = {
      alta: 1,
      media: 2,
      baja: 3,
    };
    return orden[prioridad];
  }
}