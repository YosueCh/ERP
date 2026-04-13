import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Card } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';

import { AuthService, User } from '../../core/services/auth';
import { ApiService } from '../../core/services/api.service';
import { HasPermissionDirective } from '../../core/directives/has-permission';

type TicketEstado    = 'pendiente' | 'en_progreso' | 'revision' | 'hecho';
type TicketPrioridad = 'baja' | 'media' | 'alta';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    FormsModule,
    Card,
    TagModule,
    Divider,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    SkeletonModule,
    TableModule,
    HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  dialogVisible = false;
  loadingTickets = true;
  assignedTickets: any[] = [];

  editData = {
    name:            '',
    email:           '',
    usuario:         '',
    direccion:       '',
    password:        '',
    confirmPassword: '',
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  async loadTickets(): Promise<void> {
    const userId = this.user?.id;
    if (!userId) return;
    this.loadingTickets = true;
    try {
      const response = await this.apiService.getTicketsByUser(userId).toPromise();
      this.assignedTickets = response?.data ?? [];
    } catch {
      console.error('Error cargando tickets');
    } finally {
      this.loadingTickets = false;
    }
  }

  get user(): User | null {
    return this.authService.currentUser();
  }

  get userInitial(): string {
    return (this.user?.name ?? 'U').charAt(0).toUpperCase();
  }

  get totalAsignados(): number { return this.assignedTickets.length; }

  get totalPendientes(): number {
    return this.assignedTickets.filter(t => t.estado === 'pendiente' || t.estado === 'revision').length;
  }

  get totalEnProgreso(): number {
    return this.assignedTickets.filter(t => t.estado === 'en_progreso').length;
  }

  get totalHechos(): number {
    return this.assignedTickets.filter(t => t.estado === 'hecho').length;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

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

  async save(): Promise<void> {
    if (!this.editData.name || !this.editData.email || !this.editData.usuario) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre, email y usuario son obligatorios' });
      return;
    }
    if (this.editData.password && this.editData.password !== this.editData.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
      return;
    }
    try {
      const payload: any = {
        nombre:    this.editData.name,
        email:     this.editData.email,
        usuario:   this.editData.usuario,
        direccion: this.editData.direccion,
      };
      if (this.editData.password) payload.password = this.editData.password;

      await this.apiService.updateUser(this.user!.id, payload).toPromise();

      this.authService.updateUser({
        ...this.user!,
        name:      this.editData.name,
        email:     this.editData.email,
        usuario:   this.editData.usuario,
        direccion: this.editData.direccion,
      });

      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Perfil actualizado correctamente' });
      this.dialogVisible = false;
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el perfil' });
    }
  }

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
}