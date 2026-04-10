import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

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
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayoutComponent {

  pageTitle = '';
  pageIcon  = '';

  private readonly routeTitles: Record<string, { title: string; icon: string }> = {
    '/home':          { title: 'Dashboard',         icon: 'pi-home' },
    '/users':         { title: 'Mi perfil',          icon: 'pi-user' },
    '/groups':        { title: 'Grupos',             icon: 'pi-th-large' },
    '/admin-groups':  { title: 'Admin de grupos',    icon: 'pi-cog' },
    '/admin-users':   { title: 'Admin de usuarios',  icon: 'pi-users' },
  };

  get userInitial(): string {
    return (this.authService.currentUser()?.name ?? 'U').charAt(0).toUpperCase();
  }

  get userName(): string {
    return this.authService.currentUser()?.name ?? 'Usuario';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url    = e.urlAfterRedirects.split('?')[0].split('#')[0];
      const match  = Object.keys(this.routeTitles).find(k => url.startsWith(k));
      const config = match ? this.routeTitles[match] : { title: 'ERP Seguridad', icon: 'pi-bolt' };
      this.pageTitle = config.title;
      this.pageIcon  = config.icon;
    });
  }
}