import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth';
import { PermissionsService } from '../../core/services/permissions';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    SelectModule,
    ChartModule,
    SkeletonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  grupos: any[]    = [];
  selectedGroup: any = null;
  stats: any       = null;
  loading          = true;
  loadingStats     = false;

 readonly today: string = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  // Chart data
  estadoChartData: any  = null;
  estadoChartOptions: any = null;
  prioridadChartData: any = null;
  prioridadChartOptions: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  get user() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    this.loadGroups();
    this.setupChartOptions();
  }

  async loadGroups(): Promise<void> {
    this.loading = true;
    try {
      const userId = this.user?.id;
      if (!userId) return;

      const response = await this.apiService.getGroupsByUser(userId).toPromise();
      this.grupos = response?.data ?? [];

      if (this.grupos.length > 0) {
        this.selectedGroup = this.grupos[0];
        await this.onGroupChange(this.selectedGroup);
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos',
      });
    } finally {
      this.loading = false;
    }
  }

  async onGroupChange(group: any): Promise<void> {
    if (!group) return;
    this.selectedGroup = group;
    this.permissionsService.refreshPermissionsForGroup(String(group.id));
    await this.loadStats(group.id);
  }

  async loadStats(groupId: number): Promise<void> {
    this.loadingStats = true;
    try {
      const response = await this.apiService.getTicketStats(groupId).toPromise();
      this.stats = response?.data;
      this.updateCharts();
    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      this.loadingStats = false;
    }
  }

  setupChartOptions(): void {
    const textColor      = '#94a3b8';
    const gridColor      = 'rgba(148, 163, 184, 0.1)';

    this.estadoChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, padding: 16, font: { size: 12 } },
        },
      },
    };

    this.prioridadChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid:  { color: gridColor },
        },
        y: {
          ticks: { color: textColor, stepSize: 1 },
          grid:  { color: gridColor },
          beginAtZero: true,
        },
      },
    };
  }

  updateCharts(): void {
    if (!this.stats) return;

    const { por_estado, por_prioridad } = this.stats;

    this.estadoChartData = {
      labels: ['Pendiente', 'En Progreso', 'Revisión', 'Hecho'],
      datasets: [{
        data: [
          por_estado.pendiente,
          por_estado.en_progreso,
          por_estado.revision,
          por_estado.hecho,
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          '#f59e0b',
          '#3b82f6',
          '#a855f7',
          '#10b981',
        ],
        borderWidth: 2,
      }],
    };

    this.prioridadChartData = {
      labels: ['Baja', 'Media', 'Alta'],
      datasets: [{
        label: 'Tickets',
        data: [
          por_prioridad.baja,
          por_prioridad.media,
          por_prioridad.alta,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderRadius: 8,
      }],
    };
  }

  goToGroup(group: any): void {
    this.permissionsService.refreshPermissionsForGroup(String(group.id));
    this.router.navigate(['/group-dashboard', group.id], {
      state: { group },
    });
  }

  getGroupInitial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }
}