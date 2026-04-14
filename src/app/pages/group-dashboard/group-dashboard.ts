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
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { HasPermissionDirective } from '../../core/directives/has-permission';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth';
import { PermissionsService } from '../../core/services/permissions';

type TicketEstado    = 'pendiente' | 'en_progreso' | 'revision' | 'hecho';
type TicketPrioridad = 'baja' | 'media' | 'alta';
type FiltroRapido   = 'ninguno' | 'mis_tickets' | 'sin_asignar';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [
    NgClass, FormsModule, DragDropModule,
    ButtonModule, CardModule, TagModule, AvatarModule,
    DialogModule, InputTextModule, TextareaModule,
    ToastModule, SkeletonModule, SelectModule,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './group-dashboard.html',
  styleUrl: './group-dashboard.css',
})
export class GroupDashboard implements OnInit {
  group: any = null;
  groupId    = 0;
  tickets: any[]       = [];
  miembrosGrupo: any[] = [];
  loading = true;

  vista: 'kanban' | 'lista' = 'kanban';
  filtroEstado: TicketEstado | 'todos' = 'todos';
  filtroRapido: FiltroRapido = 'ninguno';

  dialogVisible = false;
  detailVisible = false;
  editVisible   = false;

  selectedTicket: any = null;
  comentarioNuevo = '';

  filtroListaEstado: TicketEstado | 'todos' = 'todos';
  filtroListaPrioridad: TicketPrioridad | 'todas' = 'todas';
  filtroListaAsignado = '';
  ordenLista = 'id_asc';

  // Paginación
  paginaActual     = 1;
  ticketsPorPagina = 10;

  nuevoTicket = {
    titulo: '', descripcion: '', estado: 'pendiente' as TicketEstado,
    asignadoId: null as string | null,
    prioridad: 'media' as TicketPrioridad, fechaLimite: '',
  };

  editDetailData = {
    titulo: '', descripcion: '',
    asignadoId: null as string | null,
    prioridad: 'media' as TicketPrioridad,
    estado: 'pendiente' as TicketEstado,
    fechaLimite: '',
  };

  readonly columnas = [
    { estado: 'pendiente'   as TicketEstado, label: 'Pendiente',   color: '#f59e0b', icon: 'pi-clock' },
    { estado: 'en_progreso' as TicketEstado, label: 'En Progreso', color: '#3b82f6', icon: 'pi-spinner' },
    { estado: 'revision'    as TicketEstado, label: 'Revisión',    color: '#a855f7', icon: 'pi-search' },
    { estado: 'hecho'       as TicketEstado, label: 'Hecho',       color: '#10b981', icon: 'pi-check-circle' },
  ];

  prioridadOpciones = [
    { label: 'Baja', value: 'baja' }, { label: 'Media', value: 'media' }, { label: 'Alta', value: 'alta' },
  ];

  prioridadFiltroOpciones = [
    { label: 'Todas las prioridades', value: 'todas' },
    { label: 'Baja', value: 'baja' }, { label: 'Media', value: 'media' }, { label: 'Alta', value: 'alta' },
  ];

  estadoOpciones = [
    { label: 'Pendiente', value: 'pendiente' }, { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Revisión', value: 'revision' }, { label: 'Hecho', value: 'hecho' },
  ];

  estadoFiltroOpciones = [
    { label: 'Todos los estados', value: 'todos' },
    { label: 'Pendiente', value: 'pendiente' }, { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Revisión', value: 'revision' }, { label: 'Hecho', value: 'hecho' },
  ];

  ordenOpciones = [
    { label: 'ID ascendente', value: 'id_asc' }, { label: 'ID descendente', value: 'id_desc' },
    { label: 'Título A-Z', value: 'titulo_asc' }, { label: 'Título Z-A', value: 'titulo_desc' },
    { label: 'Fecha límite más próxima', value: 'fecha_limite_asc' },
    { label: 'Fecha límite más lejana', value: 'fecha_limite_desc' },
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private messageService: MessageService,
  ) {}

  get usuarioActual() { return this.authService.currentUser(); }
  get connectedLists(): string[] { return this.columnas.map(c => c.estado); }

  get miembrosOpciones(): { label: string; value: string }[] {
    return this.miembrosGrupo.map(m => ({ label: m.nombre, value: m.id }));
  }

  // ── Paginación ────────────────────────────────────────────────────────────
  get ticketsListaPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.ticketsPorPagina;
    return this.ticketsLista.slice(inicio, inicio + this.ticketsPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.ticketsLista.length / this.ticketsPorPagina));
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
  }

  async ngOnInit(): Promise<void> {
    const state = history.state as { group: any } | undefined;
    if (state?.group) {
      this.group   = state.group;
      this.groupId = state.group.id;
      await this.loadData();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [groupRes, ticketsRes] = await Promise.all([
        this.apiService.getGroupById(this.groupId).toPromise(),
        this.apiService.getTicketsByGroup(this.groupId).toPromise(),
      ]);
      this.miembrosGrupo = groupRes?.data?.miembros ?? [];
      this.tickets = (ticketsRes?.data ?? []).map((t: any) => ({
        ...t,
        asignadoA:    t.asignado?.nombre ?? 'Sin asignar',
        asignadoId:   t.asignado?.id     ?? t.asignado_a ?? null,
        creadoPor:    t.creador?.nombre  ?? '—',
        creadoPorId:  t.creador?.id      ?? null,
        fechaLimite:  t.fecha_limite     ?? null,
        comentarios:  [],
        historial:    [],
        estadoInline: t.estado,
      }));
      this.paginaActual = 1; // reset paginación al recargar
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del grupo' });
    } finally {
      this.loading = false;
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  getTicketsPorEstado(estado: TicketEstado): any[] {
    return this.aplicarFiltroRapido(this.tickets.filter(t => t.estado === estado));
  }

  aplicarFiltroRapido(lista: any[]): any[] {
    switch (this.filtroRapido) {
      case 'mis_tickets': return lista.filter(t => t.asignadoId === this.usuarioActual?.id);
      case 'sin_asignar': return lista.filter(t => !t.asignadoId);
      default: return lista;
    }
  }

  get ticketsLista(): any[] {
    let r = this.aplicarFiltroRapido([...this.tickets]);
    if (this.filtroListaEstado !== 'todos') r = r.filter(t => t.estado === this.filtroListaEstado);
    if (this.filtroListaPrioridad !== 'todas') r = r.filter(t => t.prioridad === this.filtroListaPrioridad);
    if (this.filtroListaAsignado.trim()) r = r.filter(t => t.asignadoA?.toLowerCase().includes(this.filtroListaAsignado.trim().toLowerCase()));
    switch (this.ordenLista) {
      case 'id_asc':            r.sort((a, b) => a.id - b.id); break;
      case 'id_desc':           r.sort((a, b) => b.id - a.id); break;
      case 'titulo_asc':        r.sort((a, b) => a.titulo.localeCompare(b.titulo)); break;
      case 'titulo_desc':       r.sort((a, b) => b.titulo.localeCompare(a.titulo)); break;
      case 'fecha_limite_asc':  r.sort((a, b) => this.getFechaSortable(a.fechaLimite) - this.getFechaSortable(b.fechaLimite)); break;
      case 'fecha_limite_desc': r.sort((a, b) => this.getFechaSortable(b.fechaLimite) - this.getFechaSortable(a.fechaLimite)); break;
    }
    return r;
  }

  private getFechaSortable(f?: string | null): number {
    return f ? new Date(f).getTime() : Number.MAX_SAFE_INTEGER;
  }

  setFiltro(estado: TicketEstado | 'todos'): void { this.filtroEstado = estado; }
  setFiltroRapido(filtro: FiltroRapido): void { this.filtroRapido = filtro; }
  limpiarFiltroRapido(): void { this.filtroRapido = 'ninguno'; }

  limpiarFiltrosLista(): void {
    this.filtroListaEstado = 'todos'; this.filtroListaPrioridad = 'todas';
    this.filtroListaAsignado = ''; this.ordenLista = 'id_asc';
    this.filtroRapido = 'ninguno'; this.paginaActual = 1;
  }

  goBack(): void { this.router.navigate(['/home']); }

  // ── Permisos ──────────────────────────────────────────────────────────────
  canMoveTicket(ticket: any): boolean {
    const esMio        = ticket.asignadoId === this.usuarioActual?.id;
    const tienePermiso = this.permissionsService.hasPermission('ticket:edit_state');
    return esMio || tienePermiso;
  }

  canEditFull(ticket: any): boolean {
    const esCreadoPorId = ticket.creadoPorId === this.usuarioActual?.id;
    const tienePermiso  = this.permissionsService.hasPermission('ticket:edit');
    return esCreadoPorId || tienePermiso;
  }

  // ── CRUD Tickets ──────────────────────────────────────────────────────────
  openCrearTicket(): void {
    this.nuevoTicket = { titulo: '', descripcion: '', estado: 'pendiente', asignadoId: null, prioridad: 'media', fechaLimite: '' };
    this.dialogVisible = true;
  }

  async crearTicket(): Promise<void> {
    if (!this.nuevoTicket.titulo.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El título es obligatorio' });
      return;
    }
    try {
      await this.apiService.createTicket({
        titulo:       this.nuevoTicket.titulo.trim(),
        descripcion:  this.nuevoTicket.descripcion.trim(),
        estado:       this.nuevoTicket.estado,
        prioridad:    this.nuevoTicket.prioridad,
        asignado_a:   this.nuevoTicket.asignadoId || null,
        fecha_limite: this.nuevoTicket.fechaLimite || null,
        grupo_id:     this.groupId,
      }).toPromise();
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Ticket creado correctamente' });
      this.dialogVisible = false;
      await this.loadData();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ticket' });
    }
  }

  async openDetail(ticket: any): Promise<void> {
    this.selectedTicket  = { ...ticket, comentarios: [], historial: [] };
    this.detailVisible   = true;
    this.comentarioNuevo = '';

    try {
      const res = await this.apiService.getTicketById(ticket.id).toPromise();
      if (res?.data) {
        this.selectedTicket = {
          ...this.selectedTicket,
          comentarios: res.data.comentarios ?? [],
          historial:   res.data.historial   ?? [],
        };
      }
    } catch { /* usa datos base */ }
  }

  openEdit(): void {
    if (!this.selectedTicket) return;
    this.editDetailData = {
      titulo:      this.selectedTicket.titulo,
      descripcion: this.selectedTicket.descripcion,
      asignadoId:  this.selectedTicket.asignadoId ?? null,
      prioridad:   this.selectedTicket.prioridad,
      estado:      this.selectedTicket.estado,
      fechaLimite: this.selectedTicket.fechaLimite ?? '',
    };
    this.comentarioNuevo = '';
    this.detailVisible   = false;
    this.editVisible     = true;
  }

  async saveDetail(): Promise<void> {
    if (!this.selectedTicket) return;
    try {
      await this.apiService.updateTicket(this.selectedTicket.id, {
        titulo:       this.editDetailData.titulo.trim(),
        descripcion:  this.editDetailData.descripcion.trim(),
        asignado_a:   this.editDetailData.asignadoId || null,
        prioridad:    this.editDetailData.prioridad,
        estado:       this.editDetailData.estado,
        fecha_limite: this.editDetailData.fechaLimite || null,
        grupo_id:     this.groupId,
      }).toPromise();

      if (this.comentarioNuevo.trim()) {
        await this.apiService.addComment(this.selectedTicket.id, this.comentarioNuevo.trim()).toPromise();
        this.comentarioNuevo = '';
      }

      this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Ticket actualizado correctamente' });
      this.editVisible = false;
      await this.loadData();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el ticket' });
    }
  }

  async deleteTicket(): Promise<void> {
  if (!this.selectedTicket) return;
  try {
    await this.apiService.deleteTicket(this.selectedTicket.id).toPromise();
    this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Ticket eliminado correctamente' });
    this.detailVisible = false;
    this.selectedTicket = null;
    await this.loadData();
  } catch {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ticket' });
  }
}

  // ── Cambio de estado inline ───────────────────────────────────────────────
  async cambiarEstadoInline(ticket: any, nuevoEstado: TicketEstado): Promise<void> {
    if (!nuevoEstado || nuevoEstado === ticket.estado) return;
    const estadoAnterior = ticket.estado;
    ticket.estado        = nuevoEstado;
    ticket.estadoInline  = nuevoEstado;
    try {
      await this.apiService.updateTicketStatus(ticket.id, nuevoEstado, this.groupId).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Estado actualizado',
        detail: `Ticket pasó a ${this.getEstadoLabel(nuevoEstado)}`,
      });
      await this.loadData();
    } catch {
      ticket.estado       = estadoAnterior;
      ticket.estadoInline = estadoAnterior;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' });
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  async onDrop(event: CdkDragDrop<any[]>, nuevoEstado: TicketEstado): Promise<void> {
    const ticket = event.previousContainer.data[event.previousIndex];
    if (!ticket) return;

    if (!this.canMoveTicket(ticket)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'Solo puedes mover tickets asignados a ti o con permiso ticket:edit_state',
      });
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    try {
      await this.apiService.updateTicketStatus(ticket.id, nuevoEstado, this.groupId).toPromise();
      ticket.estado = nuevoEstado;
      this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `Ticket pasó a ${this.getEstadoLabel(nuevoEstado)}` });
    } catch {
      transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getEstadoLabel(estado: TicketEstado): string {
    const map: Record<TicketEstado, string> = {
      pendiente: 'Pendiente', en_progreso: 'En Progreso', revision: 'Revisión', hecho: 'Hecho',
    };
    return map[estado] ?? estado;
  }

  getEstadoSeverity(estado: TicketEstado): 'warn' | 'info' | 'secondary' | 'success' {
    const map: Record<TicketEstado, 'warn' | 'info' | 'secondary' | 'success'> = {
      pendiente: 'warn', en_progreso: 'info', revision: 'secondary', hecho: 'success',
    };
    return map[estado] ?? 'secondary';
  }

  getPrioridadLabel(prioridad: TicketPrioridad): string {
    const map: Record<TicketPrioridad, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };
    return map[prioridad] ?? prioridad;
  }

  getPrioridadSeverity(prioridad: TicketPrioridad): 'secondary' | 'warn' | 'danger' {
    const map: Record<TicketPrioridad, 'secondary' | 'warn' | 'danger'> = {
      baja: 'secondary', media: 'warn', alta: 'danger',
    };
    return map[prioridad] ?? 'secondary';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}