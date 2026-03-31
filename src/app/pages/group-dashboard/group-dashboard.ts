import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { HasPermissionDirective } from '../../core/directives/has-permission';
import {
  GroupDataService,
  GroupData,
  GroupMember,
  Ticket,
  TicketComentario,
  TicketEstado,
  TicketHistorial,
  TicketPrioridad,
} from '../../core/services/group-data';
import { UserGroup } from '../home/home';

export type FiltroRapido = 'ninguno' | 'mis_tickets' | 'sin_asignar';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    DragDropModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    SelectModule,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './group-dashboard.html',
  styleUrl: './group-dashboard.css',
})
export class GroupDashboard implements OnInit {
  group: UserGroup | null = null;
  groupId = 0;

  vista: 'kanban' | 'lista' = 'kanban';
  filtroEstado: TicketEstado | 'todos' = 'todos';
  filtroRapido: FiltroRapido = 'ninguno';

  dialogVisible = false;
  detailVisible = false;
  editingDetail = false;

  selectedTicket: Ticket | null = null;
  comentarioNuevo = '';

  usuarioActual = {
    nombre: 'Administrador',
  };

  filtroListaEstado: TicketEstado | 'todos' = 'todos';
  filtroListaPrioridad: TicketPrioridad | 'todas' = 'todas';
  filtroListaAsignado = '';
  ordenLista:
    | 'id_asc'
    | 'id_desc'
    | 'titulo_asc'
    | 'titulo_desc'
    | 'fecha_limite_asc'
    | 'fecha_limite_desc' = 'id_asc';

  nuevoTicket = {
    titulo: '',
    descripcion: '',
    estado: 'pendiente' as TicketEstado,
    asignadoA: '',
    prioridad: 'media' as TicketPrioridad,
    fechaLimite: '',
  };

  editDetailData = {
    titulo: '',
    descripcion: '',
    asignadoA: '',
    prioridad: 'media' as TicketPrioridad,
    estado: 'pendiente' as TicketEstado,
    fechaLimite: '',
  };

  prioridadOpciones = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' },
  ];

  prioridadFiltroOpciones = [
    { label: 'Todas las prioridades', value: 'todas' },
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' },
  ];

  estadoOpciones = [
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Revisión', value: 'revision' },
    { label: 'Hecho', value: 'hecho' },
  ];

  estadoFiltroOpciones = [
    { label: 'Todos los estados', value: 'todos' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Revisión', value: 'revision' },
    { label: 'Hecho', value: 'hecho' },
  ];

  ordenOpciones = [
    { label: 'ID ascendente', value: 'id_asc' },
    { label: 'ID descendente', value: 'id_desc' },
    { label: 'Título A-Z', value: 'titulo_asc' },
    { label: 'Título Z-A', value: 'titulo_desc' },
    { label: 'Fecha límite más próxima', value: 'fecha_limite_asc' },
    { label: 'Fecha límite más lejana', value: 'fecha_limite_desc' },
  ];

  readonly columnas: { estado: TicketEstado; label: string; color: string; icon: string }[] = [
    { estado: 'pendiente', label: 'Pendiente', color: '#f59e0b', icon: 'pi-clock' },
    { estado: 'en_progreso', label: 'En Progreso', color: '#3b82f6', icon: 'pi-spinner' },
    { estado: 'revision', label: 'Revisión', color: '#a855f7', icon: 'pi-search' },
    { estado: 'hecho', label: 'Hecho', color: '#10b981', icon: 'pi-check-circle' },
  ];

  constructor(
    private router: Router,
    private messageService: MessageService,
    private groupDataService: GroupDataService,
  ) {}

  ngOnInit(): void {
    const state = history.state as { group: UserGroup } | undefined;

    if (state?.group) {
      this.group = state.group;
      this.groupId = state.group.id;
    } else {
      this.router.navigate(['/home']);
    }
  }

  get groupData(): GroupData | undefined {
    return this.groupDataService.getGroupById(this.groupId);
  }

  get tickets(): Ticket[] {
    return this.groupData?.tickets ?? [];
  }

  get miembrosGrupo(): GroupMember[] {
    return this.groupData?.miembros ?? [];
  }

  get connectedLists(): string[] {
    return this.columnas.map(c => c.estado);
  }

  get ticketsLista(): Ticket[] {
    let resultado = this.aplicarFiltroRapido([...this.tickets]);

    if (this.filtroListaEstado !== 'todos') {
      resultado = resultado.filter(t => t.estado === this.filtroListaEstado);
    }

    if (this.filtroListaPrioridad !== 'todas') {
      resultado = resultado.filter(t => t.prioridad === this.filtroListaPrioridad);
    }

    if (this.filtroListaAsignado.trim()) {
      const texto = this.filtroListaAsignado.trim().toLowerCase();
      resultado = resultado.filter(t => t.asignadoA.toLowerCase().includes(texto));
    }

    switch (this.ordenLista) {
      case 'id_asc':
        resultado.sort((a, b) => a.id - b.id);
        break;
      case 'id_desc':
        resultado.sort((a, b) => b.id - a.id);
        break;
      case 'titulo_asc':
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'titulo_desc':
        resultado.sort((a, b) => b.titulo.localeCompare(a.titulo));
        break;
      case 'fecha_limite_asc':
        resultado.sort((a, b) => this.getFechaSortable(a.fechaLimite) - this.getFechaSortable(b.fechaLimite));
        break;
      case 'fecha_limite_desc':
        resultado.sort((a, b) => this.getFechaSortable(b.fechaLimite) - this.getFechaSortable(a.fechaLimite));
        break;
    }

    return resultado;
  }

  private getFechaSortable(fecha?: string | null): number {
    if (!fecha) return Number.MAX_SAFE_INTEGER;
    return new Date(fecha).getTime();
  }

  aplicarFiltroRapido(lista: Ticket[]): Ticket[] {
    switch (this.filtroRapido) {
      case 'mis_tickets':
        return lista.filter(t => t.asignadoA === this.usuarioActual.nombre);

      case 'sin_asignar':
        return lista.filter(
          t => !t.asignadoA || t.asignadoA.trim().toLowerCase() === 'sin asignar'
        );

      default:
        return lista;
    }
  }

  setFiltroRapido(filtro: FiltroRapido): void {
    this.filtroRapido = filtro;
  }

  limpiarFiltroRapido(): void {
    this.filtroRapido = 'ninguno';
  }

  limpiarFiltrosLista(): void {
    this.filtroListaEstado = 'todos';
    this.filtroListaPrioridad = 'todas';
    this.filtroListaAsignado = '';
    this.ordenLista = 'id_asc';
    this.filtroRapido = 'ninguno';
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  setFiltro(estado: TicketEstado | 'todos'): void {
    this.filtroEstado = estado;
  }

  getTicketsPorEstado(estado: TicketEstado): Ticket[] {
    const ticketsEstado = this.tickets.filter(t => t.estado === estado);
    return this.aplicarFiltroRapido(ticketsEstado);
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

  openCrearTicket(): void {
    this.nuevoTicket = {
      titulo: '',
      descripcion: '',
      estado: 'pendiente',
      asignadoA: '',
      prioridad: 'media',
      fechaLimite: '',
    };

    this.dialogVisible = true;
  }

  crearTicket(): void {
    if (!this.nuevoTicket.titulo.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'El título es obligatorio',
      });
      return;
    }

    const ticket: Ticket = {
      id: this.groupDataService.getNextTicketId(this.groupId),
      titulo: this.nuevoTicket.titulo.trim(),
      descripcion: this.nuevoTicket.descripcion.trim(),
      estado: this.nuevoTicket.estado,
      prioridad: this.nuevoTicket.prioridad,
      asignadoA: this.nuevoTicket.asignadoA.trim() || 'Sin asignar',
      creadoPor: this.usuarioActual.nombre,
      fecha: new Date().toISOString().split('T')[0],
      fechaLimite: this.nuevoTicket.fechaLimite || null,
      comentarios: [],
      historial: [
        {
          id: 1,
          accion: 'Ticket creado',
          autor: this.usuarioActual.nombre,
          fecha: new Date().toLocaleString(),
        },
      ],
    };

    if (ticket.asignadoA !== 'Sin asignar') {
      ticket.historial.push({
        id: 2,
        accion: `Asignado a ${ticket.asignadoA}`,
        autor: this.usuarioActual.nombre,
        fecha: new Date().toLocaleString(),
      });
    }

    this.groupDataService.addTicket(this.groupId, ticket);
    this.dialogVisible = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Creado',
      detail: 'Ticket creado correctamente',
    });
  }

  openDetail(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.detailVisible = true;
    this.editingDetail = false;
    this.comentarioNuevo = '';

    this.editDetailData = {
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      asignadoA: ticket.asignadoA,
      prioridad: ticket.prioridad,
      estado: ticket.estado,
      fechaLimite: ticket.fechaLimite ?? '',
    };
  }

  startEditDetail(): void {
    if (!this.selectedTicket || !this.canEditFull(this.selectedTicket)) return;

    this.editDetailData = {
      titulo: this.selectedTicket.titulo,
      descripcion: this.selectedTicket.descripcion,
      asignadoA: this.selectedTicket.asignadoA,
      prioridad: this.selectedTicket.prioridad,
      estado: this.selectedTicket.estado,
      fechaLimite: this.selectedTicket.fechaLimite ?? '',
    };

    this.editingDetail = true;
  }

  saveDetail(): void {
    const selected = this.selectedTicket;
    if (!selected) return;

    const original = this.tickets.find(t => t.id === selected.id);
    if (!original) return;

    const cambios: string[] = [];

    if (original.titulo !== this.editDetailData.titulo) cambios.push('Título actualizado');
    if (original.descripcion !== this.editDetailData.descripcion) cambios.push('Descripción actualizada');
    if (original.asignadoA !== this.editDetailData.asignadoA) cambios.push(`Asignación cambiada a ${this.editDetailData.asignadoA}`);
    if (original.prioridad !== this.editDetailData.prioridad) cambios.push(`Prioridad cambiada a ${this.getPrioridadLabel(this.editDetailData.prioridad)}`);
    if (original.estado !== this.editDetailData.estado) cambios.push(`Estado cambiado a ${this.getEstadoLabel(this.editDetailData.estado)}`);
    if ((original.fechaLimite ?? '') !== (this.editDetailData.fechaLimite ?? '')) cambios.push('Fecha límite actualizada');

    const historialNuevo = [...original.historial];

    cambios.forEach((accion, index) => {
      historialNuevo.push({
        id: historialNuevo.length + index + 1,
        accion,
        autor: this.usuarioActual.nombre,
        fecha: new Date().toLocaleString(),
      });
    });

    const actualizado: Ticket = {
      ...original,
      titulo: this.editDetailData.titulo.trim(),
      descripcion: this.editDetailData.descripcion.trim(),
      asignadoA: this.editDetailData.asignadoA.trim() || 'Sin asignar',
      prioridad: this.editDetailData.prioridad,
      estado: this.editDetailData.estado,
      fechaLimite: this.editDetailData.fechaLimite || null,
      historial: historialNuevo,
    };

    this.groupDataService.updateTicket(this.groupId, actualizado);
    this.selectedTicket = actualizado;
    this.editingDetail = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'El ticket fue actualizado correctamente',
    });
  }

  agregarComentario(): void {
    if (!this.selectedTicket || !this.comentarioNuevo.trim() || !this.canComment(this.selectedTicket)) return;

    const comentario: TicketComentario = {
      id: this.selectedTicket.comentarios.length + 1,
      autor: this.usuarioActual.nombre,
      mensaje: this.comentarioNuevo.trim(),
      fecha: new Date().toLocaleString(),
    };

    const historial: TicketHistorial = {
      id: this.selectedTicket.historial.length + 1,
      accion: 'Se agregó un comentario',
      autor: this.usuarioActual.nombre,
      fecha: new Date().toLocaleString(),
    };

    const actualizado: Ticket = {
      ...this.selectedTicket,
      comentarios: [...this.selectedTicket.comentarios, comentario],
      historial: [...this.selectedTicket.historial, historial],
    };

    this.groupDataService.updateTicket(this.groupId, actualizado);
    this.selectedTicket = actualizado;
    this.comentarioNuevo = '';

    this.messageService.add({
      severity: 'success',
      summary: 'Comentario agregado',
      detail: 'Se agregó el comentario al ticket',
    });
  }

  guardarCambioEstadoAsignado(): void {
    if (!this.selectedTicket || !this.canEditAssigned(this.selectedTicket)) return;

    if (this.selectedTicket.estado === this.editDetailData.estado) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'El estado no cambió',
      });
      return;
    }

    const actualizado: Ticket = {
      ...this.selectedTicket,
      estado: this.editDetailData.estado,
      historial: [
        ...this.selectedTicket.historial,
        {
          id: this.selectedTicket.historial.length + 1,
          accion: `Estado cambiado a ${this.getEstadoLabel(this.editDetailData.estado)}`,
          autor: this.usuarioActual.nombre,
          fecha: new Date().toLocaleString(),
        },
      ],
    };

    this.groupDataService.updateTicket(this.groupId, actualizado);
    this.selectedTicket = actualizado;

    this.messageService.add({
      severity: 'success',
      summary: 'Estado actualizado',
      detail: 'El estado del ticket fue actualizado',
    });
  }

  canEditFull(ticket: Ticket): boolean {
    return ticket.creadoPor === this.usuarioActual.nombre;
  }

  canEditAssigned(ticket: Ticket): boolean {
    return ticket.asignadoA === this.usuarioActual.nombre;
  }

  canComment(ticket: Ticket): boolean {
    return this.canEditFull(ticket) || this.canEditAssigned(ticket);
  }

  onDrop(event: CdkDragDrop<Ticket[]>, nuevoEstado: TicketEstado): void {
    if (event.previousContainer === event.container) {
      const lista = [...event.container.data];
      moveItemInArray(lista, event.previousIndex, event.currentIndex);

      const idsOrdenados = lista.map(t => t.id);
      const ticketsEstado = this.tickets.filter(t => t.estado === nuevoEstado);
      const otrosTickets = this.tickets.filter(t => t.estado !== nuevoEstado);

      const ordenados = idsOrdenados
        .map(id => ticketsEstado.find(t => t.id === id))
        .filter((t): t is Ticket => !!t);

      this.groupDataService.reorderTickets(this.groupId, [...otrosTickets, ...ordenados]);
      return;
    }

    const ticketMovido = event.previousContainer.data[event.previousIndex];
    if (!ticketMovido) return;

    const actualizado: Ticket = {
      ...ticketMovido,
      estado: nuevoEstado,
      historial: [
        ...ticketMovido.historial,
        {
          id: ticketMovido.historial.length + 1,
          accion: `Estado cambiado a ${this.getEstadoLabel(nuevoEstado)}`,
          autor: this.usuarioActual.nombre,
          fecha: new Date().toLocaleString(),
        },
      ],
    };

    this.groupDataService.updateTicket(this.groupId, actualizado);

    if (this.selectedTicket?.id === actualizado.id) {
      this.selectedTicket = actualizado;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Estado actualizado',
      detail: `El ticket pasó a ${this.getEstadoLabel(nuevoEstado)}`,
    });
  }
}