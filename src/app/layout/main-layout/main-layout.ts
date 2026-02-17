import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    SidebarComponent,
    AvatarModule,
    ButtonModule,
    ToolbarModule,
    OverlayBadgeModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayoutComponent {
  pageTitle = 'BIENVENIDO A LA APLICACIÓN';

  get userInitial(): string {
    return (this.authService.currentUser()?.name ?? 'U').charAt(0).toUpperCase();
  }

  constructor(private authService: AuthService) {}
}