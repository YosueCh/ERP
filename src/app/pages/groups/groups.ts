import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [FormsModule, SkeletonModule, ToastModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  loading       = true;
  searchTerm    = '';
  activeFilter  = 'todos';

  private readonly memberColors = [
    '#6366f1', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#3b82f6',
  ];

  readonly today: string = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
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
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos',
      });
    } finally {
      this.loading = false;
    }
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
    this.router.navigate(['/group-dashboard', group.id], {
      state: { group },
    });
  }
}