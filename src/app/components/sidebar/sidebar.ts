import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

import { AuthService } from '../../core/services/auth';
import { HasPermissionDirective } from '../../core/directives/has-permission';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permission?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, AvatarModule, RippleModule, HasPermissionDirective],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  isCollapsed = false;

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'pi-home', route: '/home' },
    { label: 'Usuarios', icon: 'pi-users', route: '/users', permission: 'users:view' },
    { label: 'Grupos', icon: 'pi-th-large', route: '/groups', permission: 'group:view' },
  ];

  get userName(): string {
    return this.authService.currentUser()?.name ?? 'Usuario';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  constructor(private authService: AuthService) {}

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  onLogout(): void {
    this.authService.logout();
  }
}